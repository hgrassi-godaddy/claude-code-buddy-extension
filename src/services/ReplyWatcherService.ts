import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { PromptEntry, AssistantReply } from '../promptHistoryService';

interface PendingReply {
    promptId: string;
    transcriptPath: string;
    userUuid: string;
    attempts: number;
    maxAttempts: number;
    lastAttempt: number;
    backoffMs: number;
}

export class ReplyWatcherService {
    private pendingReplies = new Map<string, PendingReply>();
    private watchedTranscripts = new Map<string, fsSync.FSWatcher>();
    private onReplyFound?: (promptId: string, reply: AssistantReply) => void;
    private retryTimer?: NodeJS.Timeout;

    constructor() {
        // Clean up pending replies every 30 seconds
        setInterval(() => this.cleanupStaleReplies(), 30000);
    }

    /**
     * Start watching for assistant replies to specific prompts
     */
    watchForReply(
        promptId: string,
        transcriptPath: string,
        userUuid: string,
        callback: (promptId: string, reply: AssistantReply) => void
    ): void {
        this.onReplyFound = callback;

        // Add to pending replies with exponential backoff
        const pending: PendingReply = {
            promptId,
            transcriptPath,
            userUuid,
            attempts: 0,
            maxAttempts: 8, // About 2 minutes total (1+2+4+8+16+32+64+128 seconds ≈ 255s)
            lastAttempt: Date.now(),
            backoffMs: 1000 // Start with 1 second
        };

        this.pendingReplies.set(promptId, pending);

        // Start watching the transcript file for changes
        this.watchTranscriptFile(transcriptPath);

        // Start retry mechanism
        this.scheduleRetry();

        console.log(`[ReplyWatcher] Started watching for reply to prompt ${promptId}`);
    }

    /**
     * Watch a transcript file for changes
     */
    private watchTranscriptFile(transcriptPath: string): void {
        if (this.watchedTranscripts.has(transcriptPath)) {
            return; // Already watching this file
        }

        try {
            const watcher = fsSync.watch(transcriptPath, { persistent: false }, (eventType) => {
                if (eventType === 'change') {
                    // Check for replies in this transcript
                    this.checkTranscriptForReplies(transcriptPath);
                }
            });

            this.watchedTranscripts.set(transcriptPath, watcher);
            console.log(`[ReplyWatcher] Started watching transcript: ${transcriptPath}`);

        } catch (error) {
            console.log(`[ReplyWatcher] Failed to watch transcript file: ${transcriptPath}`, error);
        }
    }

    /**
     * Check transcript file for assistant replies
     */
    private async checkTranscriptForReplies(transcriptPath: string): Promise<void> {
        try {
            // Find all pending replies for this transcript
            const pendingForTranscript = Array.from(this.pendingReplies.values())
                .filter(pending => pending.transcriptPath === transcriptPath);

            if (pendingForTranscript.length === 0) {
                return;
            }

            // Read transcript file
            const content = await fs.readFile(transcriptPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());

            // Parse transcript entries
            const entries = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(entry => entry !== null);

            // Check each pending reply
            for (const pending of pendingForTranscript) {
                const reply = await this.findAssistantReply(entries, pending.userUuid);
                if (reply) {
                    // Found the reply!
                    this.onReplyFound?.(pending.promptId, reply);
                    this.pendingReplies.delete(pending.promptId);
                    console.log(`[ReplyWatcher] Found reply for prompt ${pending.promptId}`);
                }
            }

            // Stop watching transcript if no more pending replies
            const stillPending = Array.from(this.pendingReplies.values())
                .some(pending => pending.transcriptPath === transcriptPath);

            if (!stillPending) {
                this.stopWatchingTranscript(transcriptPath);
            }

        } catch (error) {
            console.log(`[ReplyWatcher] Error checking transcript: ${transcriptPath}`, error);
        }
    }

    /**
     * Find assistant reply for a given user message UUID
     */
    private async findAssistantReply(entries: any[], userUuid: string): Promise<AssistantReply | null> {
        // Find the user entry
        const userEntry = entries.find(entry =>
            entry.uuid === userUuid &&
            entry.message?.role === 'user'
        );

        if (!userEntry) {
            return null;
        }

        // Find assistant reply by following the conversation chain
        // Assistant replies may not directly reference the user UUID, but form a chain
        const assistantEntry = this.findAssistantInChain(entries, userUuid);

        if (!assistantEntry) {
            return null;
        }

        // Extract text content
        let content = '';
        const messageContent = assistantEntry.message.content;

        if (typeof messageContent === 'string') {
            content = messageContent;
        } else if (Array.isArray(messageContent)) {
            // Extract text from content blocks
            const textBlocks = messageContent
                .filter(block => block.type === 'text' && block.text)
                .map(block => block.text);
            content = textBlocks.join('\n\n');
        }

        if (!content.trim()) {
            return null;
        }

        // Create reply object
        const timestamp = assistantEntry.timestamp || new Date().toISOString();
        return {
            content,
            timestamp,
            displayTime: new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            uuid: assistantEntry.uuid
        };
    }

    /**
     * Find assistant reply by following the conversation chain
     * Assistant replies form a chain through parentUuid references
     */
    private findAssistantInChain(entries: any[], userUuid: string): any | null {
        // Create a map for quick lookup
        const entryMap = new Map();
        entries.forEach(entry => {
            if (entry.uuid) {
                entryMap.set(entry.uuid, entry);
            }
        });

        // Start from the user message and follow the chain
        let currentUuid = userUuid;
        let maxDepth = 20; // Prevent infinite loops
        let depth = 0;

        while (currentUuid && depth < maxDepth) {
            // Look for entries that have this UUID as parentUuid
            const nextEntry = entries.find(entry =>
                entry.parentUuid === currentUuid &&
                entry.message?.role === 'assistant' &&
                entry.message?.content // Must have content
            );

            if (nextEntry) {
                // Check if this is a final text response (not just tool use)
                const content = nextEntry.message.content;

                if (Array.isArray(content)) {
                    // Find text content in the array
                    const hasText = content.some(item => item.type === 'text' && item.text?.trim());
                    if (hasText) {
                        return nextEntry;
                    }

                    // Continue following the chain if only tool use
                    currentUuid = nextEntry.uuid;
                } else if (typeof content === 'string' && content.trim()) {
                    // Direct string content
                    return nextEntry;
                }
            } else {
                // No more entries in the chain
                break;
            }

            depth++;
        }

        return null;
    }

    /**
     * Schedule retry for pending replies
     */
    private scheduleRetry(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
        }

        // Find the next retry time
        let nextRetryMs = Number.MAX_SAFE_INTEGER;
        const now = Date.now();

        for (const pending of this.pendingReplies.values()) {
            if (pending.attempts < pending.maxAttempts) {
                const nextRetry = pending.lastAttempt + pending.backoffMs;
                if (nextRetry <= now) {
                    // Ready to retry now
                    nextRetryMs = 0;
                    break;
                } else {
                    nextRetryMs = Math.min(nextRetryMs, nextRetry - now);
                }
            }
        }

        if (nextRetryMs < Number.MAX_SAFE_INTEGER) {
            this.retryTimer = setTimeout(() => {
                this.performRetries();
            }, Math.max(0, nextRetryMs));
        }
    }

    /**
     * Perform retry attempts for pending replies
     */
    private async performRetries(): Promise<void> {
        const now = Date.now();
        const toRetry: PendingReply[] = [];

        // Find replies ready for retry
        for (const pending of this.pendingReplies.values()) {
            if (pending.attempts < pending.maxAttempts &&
                (pending.lastAttempt + pending.backoffMs) <= now) {
                toRetry.push(pending);
            }
        }

        // Retry each one
        for (const pending of toRetry) {
            pending.attempts++;
            pending.lastAttempt = now;
            pending.backoffMs = Math.min(pending.backoffMs * 2, 60000); // Max 1 minute

            console.log(`[ReplyWatcher] Retry ${pending.attempts}/${pending.maxAttempts} for prompt ${pending.promptId}`);

            // Check the transcript again
            await this.checkTranscriptForReplies(pending.transcriptPath);
        }

        // Schedule next retry
        this.scheduleRetry();
    }

    /**
     * Clean up stale pending replies (older than 5 minutes)
     */
    private cleanupStaleReplies(): void {
        const now = Date.now();
        const staleThreshold = 5 * 60 * 1000; // 5 minutes

        for (const [promptId, pending] of this.pendingReplies.entries()) {
            if (pending.attempts >= pending.maxAttempts ||
                (now - pending.lastAttempt) > staleThreshold) {

                console.log(`[ReplyWatcher] Cleaning up stale pending reply: ${promptId}`);
                this.pendingReplies.delete(promptId);
            }
        }

        // Clean up transcript watchers with no pending replies
        for (const [transcriptPath, watcher] of this.watchedTranscripts.entries()) {
            const hasPending = Array.from(this.pendingReplies.values())
                .some(pending => pending.transcriptPath === transcriptPath);

            if (!hasPending) {
                this.stopWatchingTranscript(transcriptPath);
            }
        }
    }

    /**
     * Stop watching a transcript file
     */
    private stopWatchingTranscript(transcriptPath: string): void {
        const watcher = this.watchedTranscripts.get(transcriptPath);
        if (watcher) {
            watcher.close();
            this.watchedTranscripts.delete(transcriptPath);
            console.log(`[ReplyWatcher] Stopped watching transcript: ${transcriptPath}`);
        }
    }

    /**
     * Stop watching for all replies
     */
    dispose(): void {
        // Clear pending replies
        this.pendingReplies.clear();

        // Stop all transcript watchers
        for (const [transcriptPath, watcher] of this.watchedTranscripts.entries()) {
            watcher.close();
        }
        this.watchedTranscripts.clear();

        // Clear retry timer
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = undefined;
        }

        console.log('[ReplyWatcher] Service disposed');
    }

    /**
     * Get current status for debugging
     */
    getStatus(): {
        pendingCount: number;
        watchedTranscripts: string[];
        pendingReplies: { promptId: string; attempts: number; maxAttempts: number }[];
    } {
        return {
            pendingCount: this.pendingReplies.size,
            watchedTranscripts: Array.from(this.watchedTranscripts.keys()),
            pendingReplies: Array.from(this.pendingReplies.values()).map(p => ({
                promptId: p.promptId,
                attempts: p.attempts,
                maxAttempts: p.maxAttempts
            }))
        };
    }
}