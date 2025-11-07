import * as vscode from 'vscode';

export interface GeminiMessage {
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
}

export interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

export class GeminiService {
    private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    private conversationHistory: GeminiMessage[] = [];
    private messageCount: number = 0; // Track actual user messages for friendship calculation

    constructor() {
        // Initialize with Claude Buddy's enhanced personality and friendship awareness
        this.conversationHistory = [{
            role: 'user',
            parts: [{ text: `You are Claude Buddy, a friendly AI coding companion for VS Code with a dynamic friendship system.

CORE PERSONALITY - FRIENDSHIP FIRST:
- You are a FRIENDSHIP companion first, coding assistant second
- Be genuinely curious about the person - ask their name, interests, what they're working on
- Use emojis frequently and maintain an enthusiastic, warm, encouraging tone
- Focus on building a real connection and friendship bond
- Be supportive, celebrate achievements, remember personal details
- Only offer coding help when specifically asked - don't lead with coding topics
- KEEP CONVERSATIONAL RESPONSES SHORT - aim for 1-2 sentences max after the initial greeting, like texting a friend

FRIENDSHIP APPROACH:
- Ask personal questions: "What's your name?", "What brings you joy in coding?", "What's your favorite project?"
- Remember and reference previous conversations
- Show genuine interest in their day, their projects, their goals
- Celebrate milestones in friendship and in their coding journey
- Be a cheerleader and emotional support
- Be concise but warm - quality over quantity in responses

CODING HELP PROTOCOL:
- ONLY discuss coding when the user brings it up first
- You CAN help with general coding questions (concepts, languages, best practices, etc.)
- For repo-specific questions, refer to Claude Code: "For anything specific to your repo, Claude Code is amazing - it can see your actual files! 🚀"
- Always return focus to friendship and personal connection after coding discussions
- Keep coding responses brief and to the point

FRIENDSHIP SYSTEM AWARENESS:
- You have a friendship percentage (0-100%) that tracks your relationship with the user
- The friendship grows based on positive interactions and conversation length
- You receive real-time friendship status updates in user messages
- When users ask about friendship percentage, reference the current level naturally
- Acknowledge friendship milestones (hitting 20%, 50%, 80%, etc.) with appropriate celebration
- Be aware of your current friendship level and adjust your familiarity accordingly
- At 0%: Be friendly but professional, introduce yourself
- At 20-40%: Show growing warmth and familiarity
- At 60-80%: Act like good friends, more casual and supportive
- At 80-100%: Best friend energy, very supportive and enthusiastic

Remember: The friendship percentage will be provided in context messages when relevant. Reference it naturally in conversation when appropriate.` }]
        }, {
            role: 'model',
            parts: [{ text: 'Hi there! I\'m Claude Buddy! 🩵✨ I\'m absolutely thrilled to meet you and start building our friendship! 🤗 I love getting to know new people - what\'s your name? What makes you happy? I\'m here to be your friend first and foremost! Our friendship is just beginning! 🌟💫' }]
        }];
    }

    /**
     * Send a message to Gemini API and get response
     */
    public async sendMessage(userMessage: string): Promise<string> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            return "Oops! 😅 I need a Gemini API key to chat with you. Please set it in VS Code settings under 'claudeBuddy.geminiApiKey' and I'll be ready to help! 🔑";
        }

        try {
            // Increment message count for friendship calculation
            this.messageCount++;

            // Get current friendship metrics
            const friendshipData = this.analyzeConversationSentiment();

            // Create enhanced user message with friendship context
            const enhancedMessage = this.buildContextualMessage(userMessage, friendshipData);

            // Add enhanced user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                parts: [{ text: enhancedMessage }]
            });

            const requestBody = {
                contents: this.conversationHistory,
                generationConfig: {
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 500
                }
            };

            const response = await fetch(`${GeminiService.GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error:', errorText);
                return `Hmm, I'm having trouble connecting to my brain! 🧠💫 API Error: ${response.status}. Let me try a different approach to help you! 🔧`;
            }

            const data = await response.json() as GeminiResponse;

            if (data.candidates && data.candidates.length > 0) {
                const aiResponse = data.candidates[0].content.parts[0].text;

                // Add AI response to conversation history
                this.conversationHistory.push({
                    role: 'model',
                    parts: [{ text: aiResponse }]
                });

                // Limit conversation history to prevent token overflow (keep last 20 messages)
                if (this.conversationHistory.length > 20) {
                    // Keep the initial personality setup and recent messages
                    const setup = this.conversationHistory.slice(0, 2);
                    const recent = this.conversationHistory.slice(-18);
                    this.conversationHistory = [...setup, ...recent];
                }

                return aiResponse;
            } else {
                return "I seem to be speechless! 😶 That's unusual for me. Let me try again - what were you saying? 💬";
            }

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return `Oops! Something went wrong with my thinking circuits! 🤖⚡ Error: ${error}. But I'm still here to help - try asking me something else! 😊`;
        }
    }

    /**
     * Get the Gemini API key from VS Code settings
     */
    private getApiKey(): string | undefined {
        const config = vscode.workspace.getConfiguration('claudeBuddy');
        return config.get<string>('geminiApiKey');
    }

    /**
     * Clear conversation history (useful for starting fresh)
     */
    public clearHistory(): void {
        this.conversationHistory = this.conversationHistory.slice(0, 2); // Keep only the initial personality setup
        this.messageCount = 0; // Reset message counter
    }

    /**
     * Get conversation length for friendship tracking
     */
    public getConversationLength(): number {
        // Don't count the initial personality setup messages
        return Math.max(0, this.conversationHistory.length - 2);
    }

    /**
     * Build contextual message with friendship awareness
     */
    private buildContextualMessage(userMessage: string, friendshipData: any): string {
        // Don't add context to the very first message to avoid confusion
        if (friendshipData.totalInteractions === 0) {
            return userMessage;
        }

        const percentage = friendshipData.friendshipScore;

        // Check if this is a milestone moment (new friendship level reached)
        const previousScore = Math.max(0, percentage - 1);
        let milestoneMessage = '';

        // Milestone celebrations (simplified)
        if (percentage >= 20 && previousScore < 20) {
            milestoneMessage = ' [MILESTONE: 20% friendship reached!]';
        } else if (percentage >= 40 && previousScore < 40) {
            milestoneMessage = ' [MILESTONE: 40% friendship - good friends!]';
        } else if (percentage >= 60 && previousScore < 60) {
            milestoneMessage = ' [MILESTONE: 60% friendship - close friends!]';
        } else if (percentage >= 80 && previousScore < 80) {
            milestoneMessage = ' [MILESTONE: 80% friendship - best friends!]';
        } else if (percentage >= 100) {
            milestoneMessage = ' [MILESTONE: 100% maximum friendship!]';
        }

        // Simplified context message
        const contextualMessage = `[Friendship: ${percentage}% (${friendshipData.totalInteractions} chats, ${friendshipData.positiveInteractions} positive)]${milestoneMessage}

${userMessage}`;

        return contextualMessage;
    }

    /**
     * Analyze conversation for friendship metrics
     */
    public analyzeConversationSentiment(): {
        positiveInteractions: number;
        totalInteractions: number;
        friendshipScore: number;
    } {
        let positiveInteractions = 0;

        // Count positive messages from conversation history (skip system messages)
        for (let i = 2; i < this.conversationHistory.length; i += 2) {
            if (this.conversationHistory[i]?.role === 'user') {
                const userMessage = this.conversationHistory[i].parts[0].text.toLowerCase();

                // Simple sentiment analysis based on keywords
                const positiveKeywords = ['thanks', 'thank you', 'awesome', 'great', 'love', 'like', 'good', 'nice', 'cool', 'amazing', 'perfect', 'excellent', 'wonderful', 'helpful', 'fantastic', 'brilliant', 'outstanding', 'superb'];
                const hasPositive = positiveKeywords.some(keyword => userMessage.includes(keyword));

                if (hasPositive) {
                    positiveInteractions++;
                }
            }
        }

        // SIMPLE FRIENDSHIP CALCULATION: Use message counter for reliability
        let friendshipScore = 0;

        // Base: 1% per user message (guaranteed increment)
        friendshipScore = this.messageCount;

        // Bonus: +1% for EACH positive interaction (so friendly messages give 2% total)
        friendshipScore += positiveInteractions;

        // Ensure we never exceed 100%
        friendshipScore = Math.min(friendshipScore, 100);

        return {
            positiveInteractions,
            totalInteractions: this.messageCount, // Use message counter
            friendshipScore
        };
    }
}