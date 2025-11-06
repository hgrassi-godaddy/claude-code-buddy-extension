import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { ReplyWatcherService } from './services/ReplyWatcherService';

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
    private replyWatcher: ReplyWatcherService;
    private transcriptCache = new Map<string, {
        content: TranscriptEntry[];
        timestamp: number;
    }>();
    private replyCache = new Map<string, AssistantReply>(); // Cache for found replies to prevent reprocessing

    constructor() {
        this.logPath = path.join(
            os.homedir(),
            '.claude',
            'hook-logs',
            'user-prompts-log.txt'
        );
        this.replyWatcher = new ReplyWatcherService();
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
                }
            }

            // Get last N prompts
            const recentPrompts = prompts.slice(-limit);

            // Load assistant replies for each prompt
            const promptsWithReplies = await Promise.all(
                recentPrompts.map(async (prompt) => {
                    // Create cache key for this prompt
                    const cacheKey = `${prompt.sessionId}-${prompt.timestamp}-${prompt.prompt.substring(0, 100)}`;

                    // Check if we already have a cached reply for this prompt
                    const cachedReply = this.replyCache.get(cacheKey);
                    if (cachedReply) {
                        console.log(`[InitialLoad] 🚀 Using cached reply for: ${prompt.prompt.substring(0, 30)}`);
                        return {
                            ...prompt,
                            assistantReply: cachedReply
                        };
                    }

                    console.log(`[InitialLoad] Attempting to load reply for prompt: ${prompt.prompt.substring(0, 50)}`);
                    const reply = await this.loadAssistantReply(prompt);

                    if (reply) {
                        console.log(`[InitialLoad] ✅ Found reply immediately for: ${prompt.prompt.substring(0, 30)}`);
                        // Cache the reply to prevent reprocessing
                        this.replyCache.set(cacheKey, reply);
                    } else {
                        console.log(`[InitialLoad] ❌ No reply found, starting progressive watcher for: ${prompt.prompt.substring(0, 30)}`);

                        // If no reply found and we have transcript path, start watching for it
                        if (prompt.transcriptPath) {
                            // Start watching asynchronously (don't wait for it)
                            this.startWatchingForReply(prompt).catch(error => {
                                console.log('Failed to start watching for reply:', error);
                            });
                        }
                    }

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

        this.replyWatcher.dispose();
    }

    /**
     * Cache a reply for a specific prompt to prevent reprocessing
     */
    private cacheReplyForPrompt(prompt: PromptEntry, reply: AssistantReply): void {
        const cacheKey = `${prompt.sessionId}-${prompt.timestamp}-${prompt.prompt.substring(0, 100)}`;
        this.replyCache.set(cacheKey, reply);
        console.log(`[ReplyCache] Cached reply for prompt: ${prompt.prompt.substring(0, 30)}`);
    }

    /**
     * Start watching for assistant reply to a specific prompt
     */
    private async startWatchingForReply(prompt: PromptEntry): Promise<void> {
        if (!prompt.transcriptPath) {
            return;
        }

        // Extract user UUID from prompt data by matching content in transcript
        const userUuid = await this.extractUserUuid(prompt);
        if (!userUuid) {
            console.log('Cannot watch for reply - no user UUID found for prompt:', prompt.prompt.substring(0, 50));
            return;
        }

        // Generate unique prompt ID for tracking
        const promptId = `${prompt.sessionId}-${prompt.timestamp}`;

        console.log(`Starting to watch for reply to prompt: ${promptId}, user UUID: ${userUuid}`);

        this.replyWatcher.watchForReply(
            promptId,
            prompt.transcriptPath,
            userUuid,
            (foundPromptId, reply) => {
                console.log(`Reply found for prompt ${foundPromptId}:`, reply.content.substring(0, 100));

                // Cache the found reply to prevent reprocessing
                this.cacheReplyForPrompt(prompt, reply);

                // Trigger a refresh of the prompts to include the new reply
                if (this.onPromptUpdated) {
                    this.debounceReload();
                }
            }
        );
    }

    /**
     * Find the actual user message UUID by matching prompt content in transcript
     * Uses the same logic as extractAssistantReply for consistency
     */
    private async extractUserUuid(prompt: PromptEntry): Promise<string | null> {
        if (!prompt.transcriptPath) {
            return null;
        }

        try {
            // Read the transcript file
            const transcriptEntries = await this.getCachedTranscript(prompt.transcriptPath);

            // Use the same logic as extractAssistantReply for consistency
            const userEntry = this.findUserEntryByContent(transcriptEntries, prompt.prompt, prompt.timestamp);

            if (userEntry) {
                console.log(`[PromptHistory] Found matching user UUID: ${userEntry.uuid} for prompt: ${prompt.prompt.substring(0, 50)}, ${prompt.timestamp}`);
                return userEntry.uuid;
            }

            console.log(`[PromptHistory] No matching user UUID found for prompt: ${prompt.prompt.substring(0, 50)}, ${prompt.timestamp}`);
            return null;

        } catch (error) {
            console.log('Error extracting user UUID:', error);
            return null;
        }
    }

    /**
     * Unified method to find user entry by content matching
     * Used by both extractAssistantReply and extractUserUuid for consistency
     * Returns the LAST (most recent) entry that matches the prompt text
     */
    private findUserEntryByContent(entries: TranscriptEntry[], userPrompt: string, timestamp?: string): TranscriptEntry | null {
        // Use substring matching (first 50 chars) like the original extractAssistantReply
        const promptSnippet = userPrompt.substring(0, 50);

        // If we have timestamp, use it to narrow down the search
        let candidateEntries = entries.filter(entry =>
            entry.type === 'user' &&
            entry.message &&
            entry.message.role === 'user' &&
            typeof entry.message.content === 'string'
        );

        console.log(`[UserEntrySearch] Found ${candidateEntries.length} candidate user entries for prompt snippet: ${promptSnippet}, timestamp: ${timestamp || 'N/A'}`);
        // Find ALL entries that match the content (not just the first one)
        const matchingEntries = candidateEntries.filter(entry => {
            const entryContent = entry.message?.content as string;
            if (!entryContent) return false;

            // Try multiple matching strategies for robustness
            return (
                entryContent.includes(promptSnippet) ||           // Original working logic
                entryContent.includes(userPrompt.trim()) ||       // Full content match
                userPrompt.trim().includes(entryContent.trim()) || // Reverse match
                this.fuzzyMatch(entryContent, userPrompt)          // Fuzzy matching
            );
        });

        if (matchingEntries.length === 0) {
            console.log(`[UserEntrySearch] No matching entries found for prompt: ${promptSnippet}`);
            return null;
        }

        console.log(`[UserEntrySearch] Found ${matchingEntries.length} matching entries for prompt: ${promptSnippet}`);

        // Sort by timestamp and return the LAST (most recent) entry
        const sortedMatches = matchingEntries.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const lastEntry = sortedMatches[sortedMatches.length - 1];

        console.log(`[UserEntrySearch] Found ${matchingEntries.length} matching entries for prompt "${promptSnippet}", selected most recent: ${lastEntry.uuid} (${lastEntry.timestamp})`);

        return lastEntry;
    }

    /**
     * Simple fuzzy matching for content that might have minor differences
     */
    private fuzzyMatch(content1: string, content2: string): boolean {
        // Normalize both strings (remove extra whitespace, convert to lowercase)
        const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

        const norm1 = normalize(content1);
        const norm2 = normalize(content2);

        // Check if either contains the other after normalization
        return norm1.includes(norm2) || norm2.includes(norm1);
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
        // Use the unified user entry finding logic
        const userEntry = this.findUserEntryByContent(entries, userPrompt);

        if (!userEntry) {
            console.log('Could not find matching user entry for prompt:', userPrompt.substring(0, 50));
            return null;
        }

        console.log(`[AssistantReply] Found user entry UUID: ${userEntry.uuid} for prompt: ${userPrompt.substring(0, 50)}`);

        // Find all assistant replies in the conversation thread
        const assistantReplies = this.findAssistantRepliesAfter(entries, userEntry.uuid);

        if (assistantReplies.length === 0) {
            console.log('No assistant replies found for user message:', userEntry.uuid);
            // Add more debugging info
            console.log('Available entries in transcript:', entries.length);
            console.log('User entry details:', {
                uuid: userEntry.uuid,
                timestamp: userEntry.timestamp,
                content: typeof userEntry.message?.content === 'string'
                    ? userEntry.message.content.substring(0, 100)
                    : 'Non-string content'
            });
            return null;
        }

        console.log(`[AssistantReply] Found ${assistantReplies.length} assistant replies for user message: ${userEntry.uuid}`);

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
     * Uses the same logic as ReplyWatcherService for consistency
     */
    private findAssistantRepliesAfter(
        entries: TranscriptEntry[],
        userUuid: string
    ): TranscriptEntry[] {
        const replies: TranscriptEntry[] = [];

        // Follow the conversation chain step by step (like ReplyWatcherService)
        let currentUuid = userUuid;
        let maxDepth = 20; // Prevent infinite loops
        let depth = 0;
        const visitedUuids = new Set<string>(); // Prevent cycles

        console.log(`[ConversationChain] Starting chain walk from user UUID: ${userUuid}`);

        while (currentUuid && depth < maxDepth && !visitedUuids.has(currentUuid)) {
            visitedUuids.add(currentUuid);

            // Look for entries that have this UUID as parentUuid
            const nextEntries = entries.filter(entry =>
                entry.parentUuid === currentUuid &&
                entry.message?.role === 'assistant' &&
                entry.message?.content // Must have content
            );

            console.log(`[ConversationChain] Depth ${depth}: Found ${nextEntries.length} assistant entries for parent ${currentUuid}`);

            if (nextEntries.length === 0) {
                // No more entries in the chain
                break;
            }

            // Process all assistant entries at this level
            let foundTextContent = false;
            for (const nextEntry of nextEntries) {
                const content = nextEntry.message?.content;
                if (!content) continue;

                if (Array.isArray(content)) {
                    // Find text content in the array
                    const hasText = content.some(item => item.type === 'text' && item.text?.trim());
                    console.log(`[ConversationChain] Assistant entry ${nextEntry.uuid} has text content: ${hasText}`);

                    if (hasText) {
                        replies.push(nextEntry);
                        foundTextContent = true;
                    }
                    // Continue following the chain from this entry regardless
                    currentUuid = nextEntry.uuid;
                } else if (typeof content === 'string' && content.trim()) {
                    // Direct string content
                    console.log(`[ConversationChain] Assistant entry ${nextEntry.uuid} has string content`);
                    replies.push(nextEntry);
                    foundTextContent = true;
                    currentUuid = nextEntry.uuid;
                } else {
                    // No meaningful content, continue chain
                    currentUuid = nextEntry.uuid;
                }
            }

            // If we found text content, we can potentially stop here
            // But continue to see if there are more replies in the chain
            if (foundTextContent && replies.length > 0) {
                // We found at least one good reply, but continue to get all of them
            }

            depth++;
        }

        console.log(`[ConversationChain] Chain walk completed. Found ${replies.length} assistant replies`);

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