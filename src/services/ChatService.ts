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

    constructor() {
        this.geminiService = new GeminiService();
    }

    /**
     * Handle incoming chat messages from the user
     */
    public async handleChatMessage(message: string, webview: vscode.Webview): Promise<void> {
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

            // Get response from Gemini
            const response = await this.geminiService.sendMessage(message);

            // Add AI response to history
            const aiMessage: ChatMessage = {
                type: 'buddy',
                text: response,
                timestamp: new Date().toISOString()
            };
            this.conversationHistory.push(aiMessage);

            // Calculate friendship metrics
            const friendshipData = this.geminiService.analyzeConversationSentiment();

            // Simulate typing delay for more natural interaction
            const delay = Math.min(1000 + response.length * 15, 2500);
            setTimeout(() => {
                webview.postMessage({
                    command: 'receiveMessage',
                    message: response,
                    friendshipData: friendshipData
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
     * Get current friendship metrics
     */
    public getFriendshipMetrics() {
        return this.geminiService.analyzeConversationSentiment();
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
}