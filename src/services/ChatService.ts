import * as vscode from 'vscode';
import { GeminiService } from './GeminiService';

export interface ChatMessage {
    type: 'user' | 'assistant' | 'buddy';
    text: string;
    timestamp: string;
}

export interface ConversationData {
    messages: ChatMessage[];
    friendshipData?: {
        friendshipScore: number;
        totalInteractions: number;
        positiveInteractions: number;
    };
}

export class ChatService {
    private geminiService: GeminiService;
    private conversationHistory: ChatMessage[] = [];

    constructor(initialStyle: string = 'cyberpunk') {
        this.geminiService = new GeminiService(initialStyle);
    }

    /**
     * Handle incoming chat messages from the user
     */
    public async handleChatMessage(message: string, webview: vscode.Webview, friendshipPercentage?: number): Promise<void> {
        if (!message.trim()) {
            return;
        }

        // Add user message to history
        const userMessage: ChatMessage = {
            type: 'user',
            text: message,
            timestamp: new Date().toISOString()
        };
        this.conversationHistory.push(userMessage);

        try {
            // Show typing indicator
            webview.postMessage({
                command: 'showTyping',
                isTyping: true
            });

            // Get response from Gemini (pass friendship percentage for consistency)
            const response = await this.geminiService.sendMessage(message, friendshipPercentage);

            // Add AI response to history
            const aiMessage: ChatMessage = {
                type: 'buddy',
                text: response,
                timestamp: new Date().toISOString()
            };
            this.conversationHistory.push(aiMessage);

            // Simulate typing delay for more natural interaction
            const delay = Math.min(1000 + response.length * 15, 2500);
            setTimeout(() => {
                webview.postMessage({
                    command: 'receiveMessage',
                    message: response
                });

                webview.postMessage({
                    command: 'showTyping',
                    isTyping: false
                });
            }, delay);

        } catch (error) {
            console.error('Error handling chat message:', error);

            webview.postMessage({
                command: 'receiveMessage',
                message: "Oops! I'm having a bit of trouble thinking right now! 🤖💭 My circuits might be a bit overloaded. Could you try asking me again? 😊"
            });

            webview.postMessage({
                command: 'showTyping',
                isTyping: false
            });
        }
    }

    /**
     * Get current friendship metrics (deprecated - use FriendshipService instead)
     */
    public getFriendshipMetrics() {
        // This method is deprecated - FriendshipService is now the single source of truth
        return {
            friendshipScore: 0,
            totalInteractions: 0,
            positiveInteractions: 0
        };
    }

    /**
     * Clear conversation history
     */
    public clearHistory(): void {
        this.conversationHistory = [];
        this.geminiService.clearHistory();
    }

    /**
     * Load conversation history and format it for the webview
     */
    public formatConversationForWebview(): ConversationData {
        const friendshipData = this.getFriendshipMetrics();
        return {
            messages: this.conversationHistory.map(msg => ({
                type: msg.type,
                text: msg.text,
                timestamp: msg.timestamp
            })),
            friendshipData: friendshipData
        };
    }

    /**
     * Get conversation history
     */
    public getConversationHistory(): ChatMessage[] {
        return [...this.conversationHistory];
    }

    /**
     * Update the personality style
     */
    public updatePersonalityStyle(newStyle: string): void {
        this.geminiService.updatePersonalityStyle(newStyle);
    }
}