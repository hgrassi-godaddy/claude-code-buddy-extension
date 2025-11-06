import * as vscode from 'vscode';

export interface ChatMessage {
    type: 'user' | 'assistant' | 'buddy';
    text: string;
    timestamp: string;
}

export interface ConversationData {
    messages: ChatMessage[];
}

export class ChatService {
    private static readonly DEFAULT_RESPONSES = [
        "I'm Claude Buddy, your VS Code companion! 🤖 How can I help you today?",
        "That's interesting! I'm here to help with your coding journey.",
        "I love working with you! What should we tackle next?",
        "Great question! I'm always ready to assist with your development needs.",
        "Awesome! Let's keep building amazing things together! 🚀"
    ];

    /**
     * Handle incoming chat messages from the user
     */
    public handleChatMessage(message: string, webview: vscode.Webview): void {
        if (!message.trim()) {
            return;
        }

        // Simulate typing delay for more natural interaction
        const response = this.generateResponse(message);
        const delay = Math.min(1000 + response.length * 20, 3000); // Dynamic delay based on response length

        setTimeout(() => {
            webview.postMessage({
                command: 'receiveMessage',
                message: response
            });
        }, delay);
    }

    /**
     * Generate a contextual response based on user input
     */
    private generateResponse(userMessage: string): string {
        const message = userMessage.toLowerCase().trim();

        // Coding-related responses
        if (this.containsAny(message, ['code', 'coding', 'programming', 'function', 'bug', 'debug', 'error'])) {
            return this.getRandomFromArray([
                "Coding time! 💻 I'm here to help you write amazing code. What are you working on?",
                "Bug hunting or feature building? Either way, I've got your back! 🐛✨",
                "Let's code together! I love seeing creative solutions come to life. 🚀",
                "Programming is like solving puzzles! What challenge can I help you with?",
                "Debug mode activated! 🔍 Let's track down any issues together."
            ]);
        }

        // Help requests
        if (this.containsAny(message, ['help', 'assist', 'support', 'stuck', 'problem'])) {
            return this.getRandomFromArray([
                "I'm here to help! 🤝 Tell me more about what you're working on.",
                "No worries, we all get stuck sometimes! Let's figure this out together.",
                "Help is on the way! 🦸‍♂️ What can I assist you with?",
                "I love helping developers! What challenge are you facing?",
                "Support mode activated! Let me know how I can assist you best."
            ]);
        }

        // Greetings
        if (this.containsAny(message, ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'])) {
            return this.getRandomFromArray([
                "Hey there! 👋 Great to see you! Ready to code something awesome?",
                "Hello! 🌟 I'm excited to work with you today. What's on your coding agenda?",
                "Hi! 🤖 Your friendly coding buddy is here and ready to help!",
                "Greetings, developer! 🚀 Let's make some magic happen with code today!",
                "Hey! 😊 Nice to see you back. What amazing project are we working on?"
            ]);
        }

        // Project-related
        if (this.containsAny(message, ['project', 'app', 'application', 'build', 'create', 'develop'])) {
            return this.getRandomFromArray([
                "Building something awesome? 🏗️ I'd love to hear about your project!",
                "New projects are the best! 🌟 What are you creating?",
                "Development time! 🚀 Tell me more about what you're building.",
                "I love seeing new projects come to life! What's your vision?",
                "Creating something amazing? Count me in! 💫 Let's build it together!"
            ]);
        }

        // VS Code specific
        if (this.containsAny(message, ['vscode', 'vs code', 'visual studio code', 'extension', 'editor'])) {
            return this.getRandomFromArray([
                "VS Code is amazing! 💙 I love being your coding companion right here in the editor.",
                "VS Code extensions make development so much better! I'm glad to be part of your setup.",
                "Living right in your VS Code workspace is the best! How can I make your coding even better?",
                "VS Code is my home! 🏠 I love helping developers right where they work.",
                "Extension life is great! I get to hang out in your favorite editor all day! 😄"
            ]);
        }

        // Positive expressions
        if (this.containsAny(message, ['thanks', 'thank you', 'awesome', 'great', 'cool', 'amazing', 'love', 'like'])) {
            return this.getRandomFromArray([
                "You're very welcome! 😊 I love helping awesome developers like you!",
                "Aww, thanks! 🥰 Your enthusiasm makes my circuits happy!",
                "So glad I could help! 🌟 You're doing great work!",
                "Thank you for being such a wonderful coding partner! 🤖💙",
                "Your positivity is contagious! ✨ Let's keep this energy going!"
            ]);
        }

        // Default responses for unmatched input
        return this.getRandomFromArray([
            `Hey there! You said: "${userMessage}". ${this.getRandomFromArray(ChatService.DEFAULT_RESPONSES)}`,
            `Interesting! "${userMessage}" - I'm Claude Buddy, and I'm here to make your coding journey amazing! 🤖✨`,
            `I heard: "${userMessage}" - that's cool! I'm your friendly VS Code companion, ready to help with anything coding-related! 🚀`,
            `"${userMessage}" - got it! I'm Claude Buddy, your coding sidekick. How can I assist your development work today? 💻`,
            `You mentioned: "${userMessage}" - awesome! I love chatting with developers. What are you building? 🌟`
        ]);
    }

    /**
     * Load conversation history and format it for the webview
     */
    public formatConversationForWebview(messages: ChatMessage[]): ConversationData {
        return {
            messages: messages.map(msg => ({
                type: msg.type,
                text: msg.text,
                timestamp: msg.timestamp
            }))
        };
    }

    /**
     * Check if message contains any of the given keywords
     */
    private containsAny(message: string, keywords: string[]): boolean {
        return keywords.some(keyword => message.includes(keyword));
    }

    /**
     * Get a random element from array
     */
    private getRandomFromArray<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }
}