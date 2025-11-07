// Shared TypeScript interfaces and types

export interface BuddyTheme {
    jacket: string;
    hair: string;
    eye: string;
    cyber: string;
    glasses: boolean;
    pants: string;
    jacketGlow: boolean;
    outline: string;
}

export interface ColorOptions {
    [key: string]: string;
}

export interface CustomizationState {
    currentTheme: string;
    skinColor: string;
    hairStyle: string;
    hairColor: string;
    eyeColor: string;
    accessories: string[];
    topStyle: string;
    topColor: string;
    bottomStyle: string;
    bottomColor: string;
    shoeColor: string;
    expression: string;
}

export interface NavigationState {
    currentPanelIndex: number;
    panels: string[];
    titles: string[];
}

export interface FriendshipLevel {
    percentage: number;
    label: string;
    message: string;
}

// Enhanced Friendship System Interfaces
export interface FriendshipCategory {
    points: number;      // 0-100 points
    percentage: number;  // 0-100 percentage
    label: string;       // Category display name
}

export interface FriendshipHistoryEntry {
    timestamp: number;
    category: 'chat' | 'prompts' | 'notifications';
    description: string;
}

export interface FriendshipData {
    version: number;
    categories: {
        chat: number;           // 0-100 points/percentage
        prompts: number;        // 0-100 points/percentage
        notifications: number;  // 0-100 points/percentage
    };
    history: FriendshipHistoryEntry[];
    createdAt: number;
    lastUpdated: number;
}

export interface FriendshipSummary {
    categories: {
        chat: FriendshipCategory;
        prompts: FriendshipCategory;
        notifications: FriendshipCategory;
    };
    totalPoints: number;
    averagePercentage: number;
    recentHistory: FriendshipHistoryEntry[];
}

export interface WebviewMessage {
    command: string;
    [key: string]: any;
}

export interface ChatMessage {
    type: 'user' | 'assistant' | 'buddy';
    text: string;
    timestamp: string;
}

export interface ConversationMessage {
    type: string;
    text: string;
    timestamp: string;
}

// VS Code Extension specific types
export interface ExtensionConfig {
    extensionUri: vscode.Uri;
    context: vscode.ExtensionContext;
}

// Prompt history types (extending existing)
export interface PromptEntry {
    timestamp: string;
    prompt: string;
    sessionId: string;
    displayTime: string;
    transcriptPath?: string;
    assistantReply?: AssistantReply;
}

export interface AssistantReply {
    content: string;
    displayTime: string;
}

export interface TranscriptEntry {
    message?: {
        role: string;
        content?: string | Array<{type: string; text?: string}>;
    };
    ts?: string;
}

// Event types
export interface BuddyEvent {
    type: 'customization' | 'chat' | 'navigation' | 'friendship';
    data: any;
    timestamp: number;
}

// CSS Variable mapping
export interface CSSVariables {
    '--skin-color': string;
    '--hair-color': string;
    '--eye-color': string;
    '--cyber-color': string;
    '--jacket-color': string;
    '--pants-color': string;
    '--outline-color': string;
    '--top-color': string;
    '--bottom-color': string;
    '--shoe-color': string;
    '--accessory-color': string;
    '--glasses-color': string;
    '--earrings-color': string;
    '--cat-color': string;
    '--dog-color': string;
    '--mouth-color': string;
}

// Asset paths
export interface AssetPaths {
    styles: {
        main: string;
        buddy: string;
        chat: string;
        navigation: string;
        animations: string;
    };
    scripts: {
        main: string;
        constants: string;
        utils: string;
        navigation: string;
        customization: string;
        messaging: string;
        friendship: string;
    };
    assets: {
        avatar: string;
    };
    templates: {
        webview: string;
    };
}

// Configuration interfaces
export interface BuddyConfiguration {
    theme: BuddyTheme;
    customization: CustomizationState;
    friendship: FriendshipLevel;
}

// Error types
export interface BuddyError extends Error {
    code: string;
    context?: any;
}

// Utility type for deep partial
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// VS Code imports (re-export for convenience)
import * as vscode from 'vscode';