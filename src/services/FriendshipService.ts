import * as vscode from 'vscode';
import {
    FriendshipData,
    FriendshipCategory,
    FriendshipSummary,
    FriendshipHistoryEntry
} from '../types';

export class FriendshipService {
    private static readonly STORAGE_KEY = 'claudeBuddyFriendship';
    private static readonly VERSION = 1;
    private static readonly MAX_POINTS_PER_CATEGORY = 100;
    private static readonly MAX_HISTORY_ENTRIES = 100;

    private data: FriendshipData;

    constructor(private context: vscode.ExtensionContext) {
        this.data = this.loadData();
    }

    /**
     * Increment friendship points for a specific category
     */
    public incrementCategory(
        category: 'chat' | 'prompts' | 'notifications',
        points: number,
        description: string
    ): void {
        // Don't increment if already at max
        if (this.data.categories[category] >= FriendshipService.MAX_POINTS_PER_CATEGORY) {
            console.log(`[Friendship] Category ${category} already at max (${FriendshipService.MAX_POINTS_PER_CATEGORY})`);
            return;
        }

        // Increment points (cap at max)
        const oldPoints = this.data.categories[category];
        this.data.categories[category] = Math.min(
            this.data.categories[category] + points,
            FriendshipService.MAX_POINTS_PER_CATEGORY
        );

        const actualPointsGained = this.data.categories[category] - oldPoints;

        // Add to history
        const historyEntry: FriendshipHistoryEntry = {
            timestamp: Date.now(),
            category,
            description
        };

        this.data.history.unshift(historyEntry);

        // Keep only the last MAX_HISTORY_ENTRIES
        if (this.data.history.length > FriendshipService.MAX_HISTORY_ENTRIES) {
            this.data.history = this.data.history.slice(0, FriendshipService.MAX_HISTORY_ENTRIES);
        }

        // Update metadata
        this.data.lastUpdated = Date.now();

        // Persist changes
        this.saveData();

        console.log(`[Friendship] ${category} increased by ${actualPointsGained} points: ${description}`);
        console.log(`[Friendship] Current levels - Chat: ${this.data.categories.chat}%, Prompts: ${this.data.categories.prompts}%, Notifications: ${this.data.categories.notifications}%`);
    }

    /**
     * Get current friendship summary with all categories and metadata
     */
    public getFriendshipSummary(): FriendshipSummary {
        const categories = {
            chat: this.getCategoryInfo('chat'),
            prompts: this.getCategoryInfo('prompts'),
            notifications: this.getCategoryInfo('notifications')
        };

        const totalPoints = this.data.categories.chat +
                          this.data.categories.prompts +
                          this.data.categories.notifications;

        const totalPercentage = this.getTotalPercentage(); // Use total percentage instead of average

        const recentHistory = this.data.history.slice(0, 10); // Last 10 events

        return {
            categories,
            totalPoints,
            averagePercentage: totalPercentage, // This is now the total percentage, not average
            recentHistory
        };
    }

    /**
     * Get individual category information
     */
    public getCategoryInfo(category: 'chat' | 'prompts' | 'notifications'): FriendshipCategory {
        const points = this.data.categories[category];
        const percentage = points; // Points and percentage are the same (0-100)

        const labels = {
            chat: 'Chat Interactions',
            prompts: 'Claude Code Prompts',
            notifications: 'Notifications'
        };

        return {
            points,
            percentage,
            label: labels[category]
        };
    }

    /**
     * Get formatted display string for the friendship bar
     */
    public getDisplayString(): string {
        const totalPercentage = this.getTotalPercentage();
        return `Friendship ${totalPercentage}%`;
    }

    /**
     * Calculate total friendship percentage (sum of all categories, capped at 100%)
     */
    public getTotalPercentage(): number {
        const { chat, prompts, notifications } = this.data.categories;
        const total = chat + prompts + notifications;
        // Cap at 100% maximum
        return Math.min(total, 100);
    }

    /**
     * Get overall friendship level message based on total percentage
     */
    public getFriendshipMessage(): string {
        const totalPercentage = this.getTotalPercentage();

        if (totalPercentage >= 100) return "Nobody Can Stand Between Us! 💫";
        if (totalPercentage >= 90) return "Inseparable Buddies! 🌟💎";
        if (totalPercentage >= 80) return "Best Friends Forever! 🌟";
        if (totalPercentage >= 60) return "Close Friends! 💫";
        if (totalPercentage >= 40) return "Good Friends! 😊";
        if (totalPercentage >= 20) return "Getting Along Well! 👍";
        if (totalPercentage >= 10) return "Building Friendship! 🤝";
        return "Just Getting Started! 👋";
    }

    /**
     * Get recent activity history (for modal display)
     */
    public getRecentHistory(limit: number = 10): FriendshipHistoryEntry[] {
        return this.data.history.slice(0, limit);
    }

    /**
     * Reset all friendship data (for testing/debugging)
     */
    public resetFriendship(): void {
        this.data = this.createDefaultData();
        this.saveData();
        console.log('[Friendship] Reset to default state');
    }

    /**
     * Load friendship data from VS Code globalState
     */
    private loadData(): FriendshipData {
        try {
            const stored = this.context.globalState.get<FriendshipData>(FriendshipService.STORAGE_KEY);

            if (stored && stored.version === FriendshipService.VERSION) {
                return stored;
            }

            if (stored && stored.version !== FriendshipService.VERSION) {
                console.log(`[Friendship] Version mismatch (${stored.version} vs ${FriendshipService.VERSION}), migrating...`);
                return this.migrateData(stored);
            }

            console.log('[Friendship] No existing data, creating default');
            return this.createDefaultData();

        } catch (error) {
            console.error('[Friendship] Error loading data, using default:', error);
            return this.createDefaultData();
        }
    }

    /**
     * Save friendship data to VS Code globalState
     */
    private saveData(): void {
        try {
            this.context.globalState.update(FriendshipService.STORAGE_KEY, this.data);
        } catch (error) {
            console.error('[Friendship] Error saving data:', error);
        }
    }

    /**
     * Create default friendship data
     */
    private createDefaultData(): FriendshipData {
        const now = Date.now();
        return {
            version: FriendshipService.VERSION,
            categories: {
                chat: 0,
                prompts: 0,
                notifications: 0
            },
            history: [{
                timestamp: now,
                category: 'notifications',
                description: 'Fresh install - Claude Buddy is ready! 🤖✨'
            }],
            createdAt: now,
            lastUpdated: now
        };
    }

    /**
     * Migrate data from older versions
     */
    private migrateData(oldData: any): FriendshipData {
        // For now, just recreate - future versions can implement proper migration
        console.log('[Friendship] Migration not implemented, using default data');
        return this.createDefaultData();
    }

    /**
     * Calculate total friendship from data
     */
    private calculateTotalFromData(data: FriendshipData): number {
        const { chat, prompts, notifications } = data.categories;
        const total = chat + prompts + notifications;
        return Math.min(total, 100);
    }

    /**
     * Get debug information
     */
    public getDebugInfo(): any {
        return {
            version: this.data.version,
            categories: this.data.categories,
            historyCount: this.data.history.length,
            createdAt: new Date(this.data.createdAt),
            lastUpdated: new Date(this.data.lastUpdated),
            storageKey: FriendshipService.STORAGE_KEY
        };
    }
}