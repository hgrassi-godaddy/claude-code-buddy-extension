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
    private hasShownRecentActivityNotification: boolean = false;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._context = context;
        this.friendshipService = new FriendshipService(context);

        // Get saved avatar config to initialize chat service with correct style
        const savedConfig = context.globalState.get('claudeBuddyAvatarConfig') as any;
        const initialStyle = savedConfig?.style || 'cyberpunk';


        // Pass friendshipService to promptHistory for friendship tracking integration
        this.promptHistory = new PromptHistoryService(this.friendshipService);
        this.chatService = new ChatService(initialStyle);
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
                        // Enable Claude Code prompt tracking after first user interaction
                        this.promptHistory.enableTracking();


                        // Increment chat friendship category BEFORE handling the chat message
                        this.friendshipService.incrementCategory('chat', 1, 'Sent a chat message');

                        // Handle chat messages here with updated friendship percentage
                        this._handleChatMessage(message.text, message.style, webviewView.webview);

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

                        // Update version tracking without resetting data (data persists across installs)
                        const currentVersion = '0.0.1';
                        this._context.globalState.update('claudeBuddyVersion', currentVersion);

                        // Process recent Claude Code activity for initial friendship display
                        this.promptHistory.loadRecentActivityForFriendship().then(() => {
                            console.log('[Extension] Recent activity processed, sending friendship update...');

                            // Send updated friendship data after processing recent activity
                            // The webview will handle showing the notification when it receives this update
                            this._sendFriendshipUpdate(webviewView.webview);
                        }).catch(error => {
                            console.log('[Extension] No recent activity to process:', error);
                        });

                        // Send initial friendship data (will be updated after recent activity processing)
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

                    case 'dismissNotification':
                        // User dismissed the recent activity notification
                        console.log('[Extension] Recent activity notification dismissed');
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

    private async _handleChatMessage(message: string, style: string, webview: vscode.Webview) {
        // ALWAYS update personality to match current UI selection (no conditions)
        const currentStyle = style || 'cyberpunk';
        this.chatService.updatePersonalityStyle(currentStyle);

        // Get current friendship percentage from FriendshipService (single source of truth)
        const friendshipPercentage = this.friendshipService.getTotalPercentage();

        await this.chatService.handleChatMessage(message, webview, friendshipPercentage);
    }

    private _showRecentActivityNotification(webview: vscode.Webview) {
        // Only show once and only if there's existing friendship data from recent activity
        console.log('[Extension] Checking recent activity notification. hasShown:', this.hasShownRecentActivityNotification);

        if (this.hasShownRecentActivityNotification) {
            console.log('[Extension] Recent activity notification already shown, skipping');
            return;
        }

        const currentPercentage = this.friendshipService.getTotalPercentage();
        console.log('[Extension] Current friendship percentage:', currentPercentage);

        if (currentPercentage > 0) {
            console.log('[Extension] Showing recent activity notification for', currentPercentage + '%');
            this.hasShownRecentActivityNotification = true;
            webview.postMessage({
                command: 'showRecentActivityNotification',
                data: {
                    percentage: currentPercentage,
                    message: `Loaded ${currentPercentage}% friendship from recent Claude Code activity. Press Reset if you want to start fresh!`
                }
            });
        } else {
            console.log('[Extension] No recent activity to notify about (0%)');
        }
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

        // Update chat service personality style if style has changed
        if (config && config.style) {
            this.chatService.updatePersonalityStyle(config.style);
        }
    }

    private _loadAvatarConfig(webview: vscode.Webview) {
        const config = this._context.globalState.get('claudeBuddyAvatarConfig') as any;
        if (config) {
            // Ensure style defaults to cyberpunk if not set
            config.style = config.style || 'cyberpunk';
            webview.postMessage({
                command: 'loadAvatarConfig',
                config: config
            });
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