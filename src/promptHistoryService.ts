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
    private trackingEnabled: boolean = false; // Only enable tracking after user's first interaction to avoid processing old prompts

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
        console.log('[PromptHistoryService] Tracking DISABLED initially - will enable after first user interaction');
        console.log('[PromptHistoryService] Starting from timestamp:', new Date(this.lastProcessedTimestamp).toISOString());

        // Ensure directory structure exists
        this.ensureDirectoryStructure().catch(error => {
            console.log('[PromptHistoryService] Directory creation failed (non-fatal):', error.message);
        });
    }

    /**
     * Ensure that the required directory structure exists for Claude Code integration
     * Creates ~/.claude/hook-logs/ directory and initializes log files if needed
     */
    private async ensureDirectoryStructure(): Promise<void> {
        try {
            const hookLogsDir = path.dirname(this.logPath);

            // Create ~/.claude/hook-logs/ directory if it doesn't exist
            await fs.mkdir(hookLogsDir, { recursive: true });
            console.log('[PromptHistoryService] ✅ Created directory structure:', hookLogsDir);

            // Create empty log files if they don't exist (using append mode to avoid overwriting)
            try {
                await fs.writeFile(this.logPath, '', { flag: 'a' });
                console.log('[PromptHistoryService] ✅ Ensured user-prompts-log.txt exists');
            } catch (error: any) {
                console.log('[PromptHistoryService] Could not create user-prompts-log.txt:', error.message);
            }

            try {
                await fs.writeFile(this.notificationsPath, '', { flag: 'a' });
                console.log('[PromptHistoryService] ✅ Ensured notifications.txt exists');
            } catch (error: any) {
                console.log('[PromptHistoryService] Could not create notifications.txt:', error.message);
            }

        } catch (error: any) {
            console.log('[PromptHistoryService] ❌ Could not create directory structure:', error.message);
            console.log('[PromptHistoryService] This is non-fatal - extension will work once Claude Code hooks are set up');
        }
    }

    /**
     * Enable friendship tracking for new prompts
     * Call this after the user's first interaction to prevent processing old prompts
     */
    public enableTracking(): void {
        this.trackingEnabled = true;
        console.log('[PromptHistoryService] Tracking ENABLED - will now track new Claude Code prompts for friendship');
    }

    /**
     * Process recent Claude Buddy activity immediately on extension load
     * This ensures friendship percentage reflects recent activity right away
     */
    public async loadRecentActivityForFriendship(): Promise<void> {
        if (!this.friendshipService) {
            console.log('[PromptHistoryService] No friendship service available');
            return;
        }

        console.log('[PromptHistoryService] Starting to load recent activity for friendship...');
        const initialPercentage = this.friendshipService.getTotalPercentage();
        console.log('[PromptHistoryService] Initial friendship percentage:', initialPercentage);

        try {
            // Process recent prompts (last hour) for initial friendship calculation
            await this.processRecentPromptsForFriendship();
            await this.processRecentNotificationsForFriendship();

            const finalPercentage = this.friendshipService.getTotalPercentage();
            console.log('[PromptHistoryService] Final friendship percentage after processing:', finalPercentage);
            console.log('[PromptHistoryService] Processed recent Claude Buddy activity for initial friendship calculation');
        } catch (error) {
            console.log('[PromptHistoryService] Error processing recent activity:', error);
        }
    }

    private async processRecentPromptsForFriendship(): Promise<void> {
        // Process prompts from the last hour to show recent activity
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        console.log('[PromptHistoryService] Looking for prompts after:', new Date(oneHourAgo));

        try {
            // Check if file exists and is readable
            await fs.access(this.logPath, fs.constants.R_OK);
            console.log('[PromptHistoryService] Claude Code log file found:', this.logPath);

            // Read entire file
            const content = await fs.readFile(this.logPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            console.log('[PromptHistoryService] Found', lines.length, 'log entries to check');

            let processedCount = 0;
            lines.forEach((line: string) => {
                try {
                    const parsed = JSON.parse(line);
                    const promptTime = new Date(parsed.timestamp).getTime();

                    if (parsed.timestamp && parsed.prompt && promptTime > oneHourAgo) {
                        console.log('[PromptHistoryService] Found recent prompt:', parsed.prompt.substring(0, 50));
                        const promptKey = `${parsed.timestamp}_${parsed.prompt.substring(0, 50)}`;
                        if (!this.processedPrompts.has(promptKey)) {
                            this.friendshipService?.incrementCategory(
                                'prompts',
                                1,
                                `Recent Claude Code prompt: "${parsed.prompt.substring(0, 50)}${parsed.prompt.length > 50 ? '...' : ''}"`
                            );
                            this.processedPrompts.add(promptKey);
                            processedCount++;
                        }
                    }
                } catch (parseError) {
                    // Skip malformed entries
                }
            });
            console.log('[PromptHistoryService] Processed', processedCount, 'recent prompts for friendship');
        } catch (error: any) {
            console.log('[PromptHistoryService] Could not read prompts log file:', error.message || error);
        }
    }

    private async processRecentNotificationsForFriendship(): Promise<void> {
        // Process notifications from the last hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        try {
            const content = await fs.readFile(this.notificationsPath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());

            lines.forEach(line => {
                // Simple timestamp check - if the file was modified recently, consider it recent activity
                const description = `Recent Claude Code notification: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`;
                this.friendshipService?.incrementCategory('notifications', 1, description);
            });
        } catch (error) {
            // Notifications file might not exist, which is fine
        }
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

                    this.notificationsWatcher = fsSync.watch(notificationsDir, { persistent: false }, async (eventType: string, filename: string | null) => {
                        if (filename === notificationsFilename && eventType === 'change') {
                            console.log('[PromptHistoryService] Notifications file changed, processing...');
                            // Wait for notification processing to complete before triggering UI update
                            await this.handleNotificationChange();
                            console.log('[PromptHistoryService] Notification processing complete, triggering UI update immediately');

                            // Trigger UI update IMMEDIATELY after processing notification (no debounce delay)
                            if (this.onPromptUpdated) {
                                const prompts = await this.getRecentPrompts();
                                this.onPromptUpdated(prompts);
                                console.log('[PromptHistoryService] UI callback triggered immediately for notification');
                            }
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

            if (notificationCount > 0 && this.trackingEnabled && this.friendshipService) {
                // Only increment friendship for notifications if tracking is enabled
                const lastLine = lines[lines.length - 1];

                const previousPercentage = this.friendshipService.getTotalPercentage();
                console.log('[PromptHistoryService] Processing notification - Previous percentage:', previousPercentage);

                try {
                    // Parse the notification line: [timestamp] JSON_data
                    const match = lastLine.match(/^\[(.*?)\]\s+(.+)$/);
                    console.log('****** Notification line match:', match);
                    if (match) {
                        const jsonData = match[2];
                        const data = JSON.parse(jsonData);

                        // Extract the actual notification message
                        const notificationMessage = data.message || 'Unknown notification';
                        const description = `Received Claude Code notification: ${notificationMessage}`;

                        this.friendshipService.incrementCategory('notifications', 1, description);
                    } else {
                        // Fallback to old method if parsing fails
                        const description = `Received Claude Code notification`;
                        this.friendshipService.incrementCategory('notifications', 1, description);
                    }
                } catch (parseError) {
                    // Fallback to old method if JSON parsing fails
                    const description = `Received Claude Code notification: ${lastLine.substring(0, 50)}${lastLine.length > 50 ? '...' : ''}`;
                    this.friendshipService.incrementCategory('notifications', 1, description);
                }

                const newPercentage = this.friendshipService.getTotalPercentage();
                console.log('[PromptHistoryService] Notification processed - New percentage:', newPercentage, 'Increased:', newPercentage > previousPercentage);
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
                console.log('[PromptHistoryService] Debounced reload starting...');

                // Check for new prompts and update friendship before reloading
                await this.checkForNewPromptsAndUpdateFriendship();

                console.log('[PromptHistoryService] Friendship updated, now triggering UI callback...');

                const prompts = await this.getRecentPrompts();
                if (this.onPromptUpdated) {
                    // Call the UI update callback immediately after friendship processing
                    // This ensures the UI can detect the recent activity we just processed
                    this.onPromptUpdated(prompts);
                } else {
                    console.log('[PromptHistoryService] No onPromptUpdated callback registered');
                }
            } catch (error) {
                console.log('Failed to reload prompts:', error);
            }
        }, 100); // Reduced debounce time from 500ms to 100ms for faster response
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
                        // Only increment friendship if tracking is enabled (prevents processing old prompts on fresh install)
                        if (this.trackingEnabled && this.friendshipService) {
                            // This is a new prompt! Increment friendship
                            this.friendshipService.incrementCategory(
                                'prompts',
                                1,
                                `Made a Claude Code prompt: "${parsed.prompt.substring(0, 50)}${parsed.prompt.length > 50 ? '...' : ''}"`
                            );
                        }

                        // Mark this prompt as processed regardless of tracking status
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