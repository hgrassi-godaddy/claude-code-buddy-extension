import * as vscode from 'vscode';
import { PromptHistoryService } from '../promptHistoryService';
import { ChatService } from '../services/ChatService';
import { WebviewService } from '../services/WebviewService';
import { FriendshipService } from '../services/FriendshipService';

export class ClaudeBuddyViewProvider implements vscode.WebviewViewProvider {
    private promptHistory: PromptHistoryService;
    private chatService: ChatService;
    private webviewService: WebviewService;
    private friendshipService: FriendshipService;
    private _context: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._context = context;
        this.friendshipService = new FriendshipService(context);

        // Pass friendshipService to promptHistory for friendship tracking integration
        this.promptHistory = new PromptHistoryService(this.friendshipService);
        this.chatService = new ChatService();
        this.webviewService = new WebviewService(_extensionUri);
    }

    dispose() {
        this.promptHistory.stopWatching();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        console.log('[Extension] Generating webview HTML...');
        const html = this._getHtmlForWebview(webviewView.webview);
        console.log('[Extension] Generated HTML length:', html.length);
        console.log('[Extension] HTML includes mainJs:', html.includes('claude-buddy.js'));

        webviewView.webview.html = html;

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('[Extension] Received message from webview:', message.command);
                switch (message.command) {
                    case 'sendMessage':
                        // Handle chat messages here
                        this._handleChatMessage(message.text, webviewView.webview);

                        // Increment chat friendship category
                        this.friendshipService.incrementCategory('chat', 1, 'Sent a chat message');

                        // Send updated friendship data to webview
                        this._sendFriendshipUpdate(webviewView.webview);
                        break;
                    case 'saveAvatarConfig':
                        // Save avatar configuration
                        console.log('[Extension] Saving avatar config');
                        this._saveAvatarConfig(message.config);
                        break;
                    case 'webviewReady':
                        // Webview is ready, send initial data
                        console.log('[Extension] Webview ready, loading avatar config');
                        this._loadAvatarConfig(webviewView.webview);
                        // Send initial friendship data
                        this._sendFriendshipUpdate(webviewView.webview);
                        // this._loadPromptsAsMessages(webviewView.webview); // DISABLED - no longer loading prompts in chat
                        break;

                    case 'getFriendshipData':
                        // Send current friendship data to webview
                        this._sendFriendshipUpdate(webviewView.webview);
                        break;

                    case 'resetFriendship':
                        // Reset all friendship progress
                        console.log('[Extension] Resetting friendship progress');
                        this.friendshipService.resetFriendship();

                        // Clear processed prompts cache to start fresh
                        this.promptHistory['processedPrompts']?.clear();

                        // Send updated friendship data immediately
                        this._sendFriendshipUpdate(webviewView.webview);

                        console.log('[Extension] Friendship progress reset complete');
                        break;
                }
            },
            undefined,
            []
        );

        // NOTE: Prompt history functionality is preserved but chat updates are disabled
        // The promptHistoryService still runs in the background with all improvements:
        // - UUID extraction and caching
        // - Conversation chain parsing
        // - Progressive reply loading
        // - Friendship tracking for new prompts
        // But it no longer updates the chat interface

        // Start watching for file changes (for friendship tracking) - RE-ENABLED
        this.promptHistory.startWatching((prompts) => {
            // No longer load prompts as chat messages, but we still need the watcher
            // for friendship tracking of new prompts
            console.log('[ClaudeBuddyViewProvider] Prompt file changed, friendship tracking active');

            // Send updated friendship data to webview
            this._sendFriendshipUpdate(webviewView.webview);
        });
    }

    private async _handleChatMessage(message: string, webview: vscode.Webview) {
        await this.chatService.handleChatMessage(message, webview);
    }

    private _sendFriendshipUpdate(webview: vscode.Webview) {
        try {
            const friendshipSummary = this.friendshipService.getFriendshipSummary();
            const displayString = this.friendshipService.getDisplayString();
            const friendshipMessage = this.friendshipService.getFriendshipMessage();

            webview.postMessage({
                command: 'updateFriendship',
                data: {
                    summary: friendshipSummary,
                    displayString: displayString,
                    message: friendshipMessage
                }
            });

            console.log('[Extension] Sent friendship update:', displayString);
        } catch (error) {
            console.error('[Extension] Error sending friendship update:', error);
        }
    }

    // DISABLED: Method for loading prompts as chat messages
    // This functionality is preserved in promptHistoryService but no longer updates the chat interface
    /*
    private async _loadPromptsAsMessages(webview: vscode.Webview) {
        try {
            const prompts = await this.promptHistory.getRecentPrompts();
            if (prompts.length > 0) {
                // Create conversation messages (user prompt + assistant reply pairs)
                const conversationMessages: Array<{type: string, text: string, timestamp: string}> = [];

                // Process prompts (they're already in oldest-first order after the reverse in getRecentPrompts)
                prompts.reverse().forEach(prompt => {
                    // Add user message
                    conversationMessages.push({
                        type: 'user',
                        text: prompt.prompt,
                        timestamp: prompt.displayTime
                    });

                    // Add assistant reply if available
                    if (prompt.assistantReply) {
                        conversationMessages.push({
                            type: 'assistant',
                            text: prompt.assistantReply.content,
                            timestamp: prompt.assistantReply.displayTime
                        });
                    }
                });

                webview.postMessage({
                    command: 'loadConversation',
                    messages: conversationMessages
                });
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
            // Silently fail - extension should work without prompt history
        }
    }
    */

    private _saveAvatarConfig(config: any) {
        this._context.globalState.update('claudeBuddyAvatarConfig', config);
        console.log('Avatar config saved to globalState:', config);
    }

    private _loadAvatarConfig(webview: vscode.Webview) {
        const config = this._context.globalState.get('claudeBuddyAvatarConfig');
        if (config) {
            console.log('Loading avatar config from globalState:', config);
            webview.postMessage({
                command: 'loadAvatarConfig',
                config: config
            });
        } else {
            console.log('No saved avatar config found');
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        console.log('[Extension] _getHtmlForWebview called');

        // Validate that template files exist
        const validation = this.webviewService.validateTemplateFiles();
        console.log('[Extension] Template validation:', validation);

        if (!validation.valid) {
            console.warn('[Extension] Missing template files:', validation.missingFiles);
        }

        console.log('[Extension] Calling generateHtmlFromTemplate...');
        const html = this.webviewService.generateHtmlFromTemplate(webview);
        console.log('[Extension] Generated HTML snippet (first 200 chars):', html.substring(0, 200));

        return html;
    }
}