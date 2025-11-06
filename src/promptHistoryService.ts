import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

export interface PromptEntry {
    timestamp: string;
    prompt: string;
    sessionId: string;
    displayTime: string;
    transcriptPath?: string;              // NEW: Path to transcript file
    assistantReply?: AssistantReply;      // NEW: Latest assistant response
}

export interface AssistantReply {
    content: string;                       // Text content (combined if multiple text blocks)
    timestamp: string;
    displayTime: string;
    uuid: string;                          // For debugging/tracking
}

// Internal structure for transcript parsing
interface TranscriptEntry {
    type: string;
    uuid: string;
    parentUuid: string | null;
    timestamp: string;
    message?: {
        role: string;
        type?: string;
        content?: string | Array<{
            type: string;
            text?: string;
            // ... other fields like tool_use, thinking
        }>;
    };
}

export class PromptHistoryService {
    private logPath: string;
    private watcher?: fsSync.FSWatcher;
    private onPromptUpdated?: (prompts: PromptEntry[]) => void;
    private transcriptCache = new Map<string, {
        content: TranscriptEntry[];
        timestamp: number;
    }>();

    constructor() {
        this.logPath = path.join(
            os.homedir(),
            '.claude',
            'hook-logs',
            'user-prompts-log.txt'
        );
    }

    /**
     * Get recent prompts from the log file
     * @param limit Maximum number of prompts to return
     * @returns Array of recent prompts, most recent first
     */
    async getRecentPrompts(limit: number = 3): Promise<PromptEntry[]> {
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
                }
            }

            // Get last N prompts
            const recentPrompts = prompts.slice(-limit);

            // Load assistant replies for each prompt
            const promptsWithReplies = await Promise.all(
                recentPrompts.map(async (prompt) => {
                    const reply = await this.loadAssistantReply(prompt);
                    return {
                        ...prompt,
                        assistantReply: reply || undefined
                    };
                })
            );

            // Return most recent first
            return promptsWithReplies.reverse();

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
                transcriptPath: data.transcript_path || undefined,
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

        } catch (error: any) {
            console.log('Failed to start file watcher:', error.message);
            // Continue without file watching
        }
    }

    /**
     * Stop watching the log file
     */
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = undefined;
            console.log('Stopped watching prompt history file');
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

    /**
     * Read and parse transcript file with caching
     */
    private async getCachedTranscript(transcriptPath: string): Promise<TranscriptEntry[]> {
        const cached = this.transcriptCache.get(transcriptPath);
        const now = Date.now();

        // Cache for 30 seconds
        if (cached && (now - cached.timestamp) < 30000) {
            return cached.content;
        }

        try {
            // Read and parse transcript file
            const content = await this.readTranscriptFile(transcriptPath);

            // Cache the result
            this.transcriptCache.set(transcriptPath, {
                content,
                timestamp: now
            });

            // Limit cache size to 10 files
            if (this.transcriptCache.size > 10) {
                const oldest = Array.from(this.transcriptCache.entries())
                    .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
                this.transcriptCache.delete(oldest[0]);
            }

            return content;

        } catch (error) {
            console.log('Failed to read transcript file:', transcriptPath, error);
            return [];
        }
    }

    /**
     * Read and parse JSONL transcript file
     */
    private async readTranscriptFile(transcriptPath: string): Promise<TranscriptEntry[]> {
        // Check if file exists and is readable
        await fs.access(transcriptPath, fs.constants.R_OK);

        // Read entire file
        const content = await fs.readFile(transcriptPath, 'utf-8');

        // Parse JSONL (each line is a JSON object)
        const lines = content.split('\n').filter(line => line.trim());
        const entries: TranscriptEntry[] = [];

        for (const line of lines) {
            try {
                const entry = JSON.parse(line) as TranscriptEntry;
                entries.push(entry);
            } catch (error) {
                // Skip malformed lines silently
                continue;
            }
        }

        return entries;
    }

    /**
     * Extract assistant reply for a given user prompt from transcript entries
     */
    private async extractAssistantReply(
        entries: TranscriptEntry[],
        userPrompt: string
    ): Promise<AssistantReply | null> {
        // Find user message UUID that matches the prompt
        // For user entries, message.content is a string containing the prompt text
        const promptSnippet = userPrompt.substring(0, 50);
        const userEntry = entries.find(entry => {
            // Check if this is a user entry with message.content as string
            if (entry.type === 'user' &&
                entry.message &&
                entry.message.role === 'user' &&
                typeof entry.message.content === 'string') {
                return entry.message.content.includes(promptSnippet);
            }
            return false;
        });

        if (!userEntry) {
            console.log('Could not find matching user entry for prompt:', promptSnippet);
            return null;
        }

        // Find all assistant replies in the conversation thread
        const assistantReplies = this.findAssistantRepliesAfter(entries, userEntry.uuid);

        if (assistantReplies.length === 0) {
            console.log('No assistant replies found for user message:', userEntry.uuid);
            return null;
        }

        // Get the last reply with text content
        const lastReply = assistantReplies[assistantReplies.length - 1];
        const textContent = this.extractTextContent(lastReply);

        if (!textContent) {
            console.log('No text content found in assistant reply');
            return null;
        }

        return {
            content: textContent,
            timestamp: lastReply.timestamp,
            displayTime: this.formatTimestamp(lastReply.timestamp),
            uuid: lastReply.uuid
        };
    }

    /**
     * Find all assistant replies that come after a specific user message in the conversation thread
     */
    private findAssistantRepliesAfter(
        entries: TranscriptEntry[],
        userUuid: string
    ): TranscriptEntry[] {
        const replies: TranscriptEntry[] = [];

        // Build parent-child relationship map
        const childMap = new Map<string, TranscriptEntry[]>();
        entries.forEach(entry => {
            if (entry.parentUuid) {
                if (!childMap.has(entry.parentUuid)) {
                    childMap.set(entry.parentUuid, []);
                }
                childMap.get(entry.parentUuid)!.push(entry);
            }
        });

        // Recursively walk the conversation tree starting from the user message
        const walkTree = (uuid: string) => {
            const children = childMap.get(uuid) || [];
            children.forEach(child => {
                // Check if this is an assistant entry with message.content as array
                if (child.type === 'assistant' &&
                    child.message &&
                    child.message.role === 'assistant' &&
                    child.message.type === 'message' &&
                    Array.isArray(child.message.content)) {
                    replies.push(child);
                }
                // Continue walking the tree for nested conversations
                walkTree(child.uuid);
            });
        };

        walkTree(userUuid);

        // Sort by timestamp to ensure chronological order
        return replies.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }

    /**
     * Extract text content from transcript entry, filtering out tool_use and other non-text blocks
     */
    private extractTextContent(entry: TranscriptEntry): string {
        if (!entry.message || !entry.message.content) {
            return '';
        }

        // For assistant entries, content is an array
        if (Array.isArray(entry.message.content)) {
            const textBlocks = entry.message.content
                .filter(c => c.type === 'text' && c.text)
                .map(c => c.text!)
                .filter(t => t.trim().length > 0);

            return textBlocks.join('\n\n');
        }

        // For user entries, content is a string (but we shouldn't call this on user entries)
        if (typeof entry.message.content === 'string') {
            return entry.message.content;
        }

        return '';
    }

    /**
     * Load assistant reply for a given prompt entry
     */
    private async loadAssistantReply(promptEntry: PromptEntry): Promise<AssistantReply | null> {
        if (!promptEntry.transcriptPath) {
            return null;
        }

        try {
            // Use timeout to prevent hanging on large files
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 5000)
            );

            const replyPromise = (async () => {
                const entries = await this.getCachedTranscript(promptEntry.transcriptPath!);
                return await this.extractAssistantReply(entries, promptEntry.prompt);
            })();

            return await Promise.race([replyPromise, timeoutPromise]);

        } catch (error) {
            console.log('Error loading assistant reply:', error);
            return null;
        }
    }
}