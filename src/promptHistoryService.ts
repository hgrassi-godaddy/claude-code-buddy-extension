import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { FriendshipService } from './services/FriendshipService';

export interface PromptEntry {
    timestamp: string;
    prompt: string;
    sessionId: string;
    displayTime: string;
}

export class PromptHistoryService {
    private logPath: string;
    private notificationsPath: string;
    private watcher?: fsSync.FSWatcher;
    private notificationsWatcher?: fsSync.FSWatcher;
    private onPromptUpdated?: (prompts: PromptEntry[]) => void;
    private friendshipService?: FriendshipService;
    private processedPrompts = new Set<string>(); // Track processed prompts to avoid duplicate friendship points
    private lastProcessedTimestamp: number = Date.now(); // Track timestamp of last processed prompt for efficiency - start from current time

    constructor(friendshipService?: FriendshipService, notificationsFilePath?: string) {
        this.logPath = path.join(
            os.homedir(),
            '.claude',
            'hook-logs',
            'user-prompts-log.txt'
        );

        // Default notifications path (can be overridden)
        this.notificationsPath = notificationsFilePath || path.join(
            os.homedir(),
            '.claude',
            'hook-logs',
            'notifications.txt'  // Default assumption - user will specify actual path
        );

        this.friendshipService = friendshipService;

        console.log('[PromptHistoryService] Initialized with friendship tracking:', !!friendshipService);
        console.log('[PromptHistoryService] Notifications path:', this.notificationsPath);
        console.log('[PromptHistoryService] Will only track NEW prompts from now on (ignoring existing prompts)');
        console.log('[PromptHistoryService] Starting from timestamp:', new Date(this.lastProcessedTimestamp).toISOString());
    }

    /**
     * Get recent prompts from the log file
     * @param limit Maximum number of prompts to return
     * @returns Array of recent prompts, most recent first
     */
    async getRecentPrompts(limit: number = 2): Promise<PromptEntry[]> {
        try {
            // Check if file exists and is readable
            await fs.access(this.logPath, fs.constants.R_OK);

            // Read entire file
            const content = await fs.readFile(this.logPath, 'utf-8');

            // Parse lines
            const lines = content.split('\n').filter(line => line.trim());

            // Parse each line and extract prompts
            const prompts: PromptEntry[] = [];
            for (const line of lines) {
                const parsed = this.parseLine(line);
                if (parsed) {
                    prompts.push(parsed);
                    // Note: Friendship increment moved to file watcher to only count new prompts
                }
            }

            // Get last N prompts and return most recent first
            return prompts.slice(-limit).reverse();

        } catch (error: any) {
            console.log('Failed to read prompt history:', error.message);

            // Return empty array for graceful fallback
            if (error.code === 'ENOENT') {
                console.log('Prompt history file does not exist yet');
            } else if (error.code === 'EACCES') {
                console.log('Permission denied reading prompt history');
            }

            return [];
        }
    }

    /**
     * Parse a single log line
     * Expected format: [2025-11-06 01:00:35] {"session_id":"...", "prompt":"actual user prompt text", ...}
     */
    private parseLine(line: string): PromptEntry | null {
        try {
            // Match timestamp and JSON data
            const match = line.match(/^\[(.*?)\]\s+(.+)$/);
            if (!match) {
                return null;
            }

            const timestamp = match[1];
            const jsonData = match[2];

            // Parse JSON
            const data = JSON.parse(jsonData);

            // Validate required fields
            if (!data.prompt || typeof data.prompt !== 'string') {
                return null;
            }

            // Format display time
            const displayTime = this.formatTimestamp(timestamp);

            return {
                timestamp,
                prompt: data.prompt.trim(),
                sessionId: data.session_id || 'unknown',
                displayTime
            };

        } catch (error) {
            // Skip malformed lines silently
            return null;
        }
    }

    /**
     * Format timestamp for display
     */
    private formatTimestamp(timestamp: string): string {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 1) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
            } else if (diffHours < 24) {
                return `${Math.floor(diffHours)}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return timestamp;
        }
    }

    /**
     * Start watching the log file for changes
     * @param callback Function to call when prompts are updated
     */
    startWatching(callback: (prompts: PromptEntry[]) => void): void {
        this.onPromptUpdated = callback;

        try {
            // Create directory watcher for the parent directory
            // This is more reliable than watching the file directly
            const logDir = path.dirname(this.logPath);

            this.watcher = fsSync.watch(logDir, { persistent: false }, (eventType: string, filename: string | null) => {
                if (filename === 'user-prompts-log.txt' && eventType === 'change') {
                    // Debounce rapid file changes
                    this.debounceReload();
                }
            });

            console.log('Started watching prompt history file');

            // Also watch notifications file if friendship service is available
            if (this.friendshipService && this.notificationsPath) {
                try {
                    const notificationsDir = path.dirname(this.notificationsPath);
                    const notificationsFilename = path.basename(this.notificationsPath);

                    this.notificationsWatcher = fsSync.watch(notificationsDir, { persistent: false }, (eventType: string, filename: string | null) => {
                        if (filename === notificationsFilename && eventType === 'change') {
                            this.handleNotificationChange();
                        }
                    });

                    console.log('Started watching notifications file:', this.notificationsPath);
                } catch (error: any) {
                    console.log('Failed to start notifications watcher:', error.message);
                    // Continue without notifications watching
                }
            }

        } catch (error: any) {
            console.log('Failed to start file watcher:', error.message);
            // Continue without file watching
        }
    }

    /**
     * Stop watching the log file and notifications file
     */
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = undefined;
            console.log('Stopped watching prompt history file');
        }

        if (this.notificationsWatcher) {
            this.notificationsWatcher.close();
            this.notificationsWatcher = undefined;
            console.log('Stopped watching notifications file');
        }
    }

    /**
     * Handle notifications file changes - increment friendship for each new notification
     */
    private async handleNotificationChange(): Promise<void> {
        if (!this.friendshipService) {
            return;
        }

        try {
            // Read the notifications file
            const content = await fs.readFile(this.notificationsPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());

            // For simplicity, increment by 1 for each line in the notifications file
            // In a real implementation, you might want to track which notifications
            // have already been processed to avoid double-counting
            const notificationCount = lines.length;

            if (notificationCount > 0) {
                // Get the last notification as description
                const lastLine = lines[lines.length - 1];
                const description = `Received Claude Code notification: ${lastLine.substring(0, 50)}${lastLine.length > 50 ? '...' : ''}`;

                this.friendshipService.incrementCategory('notifications', 1, description);
            }

        } catch (error: any) {
            // File might not exist yet, which is okay
            if (error.code !== 'ENOENT') {
                console.log('Error reading notifications file:', error.message);
            }
        }
    }

    /**
     * Debounced reload to prevent excessive file reads
     */
    private debounceTimer?: NodeJS.Timeout;
    private debounceReload(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(async () => {
            try {
                // Check for new prompts and update friendship before reloading
                await this.checkForNewPromptsAndUpdateFriendship();

                const prompts = await this.getRecentPrompts();
                if (this.onPromptUpdated) {
                    this.onPromptUpdated(prompts);
                }
            } catch (error) {
                console.log('Failed to reload prompts:', error);
            }
        }, 500); // Wait 500ms after last change
    }

    /**
     * Check for new prompts and increment friendship only for genuinely new ones
     * Optimized to only read new entries instead of the entire file
     */
    private async checkForNewPromptsAndUpdateFriendship(): Promise<void> {
        if (!this.friendshipService) {
            return; // No friendship service, skip friendship tracking
        }

        try {
            // Read the entire file content
            const content = await fs.readFile(this.logPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());

            let newPromptsFound = 0;
            let latestTimestamp = this.lastProcessedTimestamp;

            // Process lines in reverse to get the most recent entries first
            // This way we can break early once we hit processed entries
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i];
                const parsed = this.parseLine(line);

                if (parsed) {
                    // Convert timestamp to milliseconds for comparison
                    const entryTimestamp = new Date(parsed.timestamp).getTime();

                    // Only process entries newer than our last processed timestamp
                    if (entryTimestamp <= this.lastProcessedTimestamp) {
                        // We've reached entries we've already processed, break early
                        console.log(`[PromptHistoryService] Reached already processed entries at ${parsed.timestamp}, stopping`);
                        break;
                    }

                    // Create a unique key for this prompt (sessionId + timestamp + content hash)
                    const promptKey = `${parsed.sessionId}-${parsed.timestamp}-${this.hashString(parsed.prompt)}`;

                    // Check if we've already processed this prompt (extra safety check)
                    if (!this.processedPrompts.has(promptKey)) {
                        // This is a new prompt! Increment friendship
                        this.friendshipService.incrementCategory(
                            'prompts',
                            1,
                            `Made a Claude Code prompt: "${parsed.prompt.substring(0, 50)}${parsed.prompt.length > 50 ? '...' : ''}"`
                        );

                        // Mark this prompt as processed
                        this.processedPrompts.add(promptKey);
                        newPromptsFound++;

                        // Update latest timestamp
                        if (entryTimestamp > latestTimestamp) {
                            latestTimestamp = entryTimestamp;
                        }

                        console.log(`[PromptHistoryService] New prompt detected for friendship: ${parsed.prompt.substring(0, 30)}`);
                    }
                }
            }

            // Update the last processed timestamp to the latest entry we found
            if (latestTimestamp > this.lastProcessedTimestamp) {
                this.lastProcessedTimestamp = latestTimestamp;
                console.log(`[PromptHistoryService] Updated last processed timestamp to: ${new Date(latestTimestamp).toISOString()}`);
            }

            if (newPromptsFound > 0) {
                console.log(`[PromptHistoryService] Processed ${newPromptsFound} new prompts for friendship tracking`);
            } else {
                console.log(`[PromptHistoryService] No new prompts found since last check`);
            }

            // Clean up old processed prompts to prevent memory bloat (keep last 1000)
            if (this.processedPrompts.size > 1000) {
                const promptsArray = Array.from(this.processedPrompts);
                const toKeep = promptsArray.slice(-500); // Keep last 500
                this.processedPrompts.clear();
                toKeep.forEach(key => this.processedPrompts.add(key));
            }

        } catch (error: any) {
            // File might not exist yet, which is okay for new installations
            if (error.code !== 'ENOENT') {
                console.log('Error checking for new prompts:', error.message);
            }
        }
    }

    /**
     * Simple hash function for creating unique prompt identifiers
     */
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    /**
     * Check if the log file exists
     */
    async fileExists(): Promise<boolean> {
        try {
            await fs.access(this.logPath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file path for debugging
     */
    getLogPath(): string {
        return this.logPath;
    }
}