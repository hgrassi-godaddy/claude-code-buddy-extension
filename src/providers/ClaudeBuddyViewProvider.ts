import * as vscode from 'vscode';
import { PromptHistoryService } from '../promptHistoryService';
import { ChatService } from '../services/ChatService';
import { WebviewService } from '../services/WebviewService';

export class ClaudeBuddyViewProvider implements vscode.WebviewViewProvider {
    private promptHistory: PromptHistoryService;
    private chatService: ChatService;
    private webviewService: WebviewService;
    private _context: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._context = context;
        this.promptHistory = new PromptHistoryService();
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

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('[Extension] Received message from webview:', message.command);
                switch (message.command) {
                    case 'sendMessage':
                        // Handle chat messages here
                        this._handleChatMessage(message.text, webviewView.webview);
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
                        this._loadPromptsAsMessages(webviewView.webview);
                        break;
                }
            },
            undefined,
            []
        );

        // Start watching for file changes (load new prompts as messages)
        this.promptHistory.startWatching((prompts) => {
            this._loadPromptsAsMessages(webviewView.webview);
        });
    }

    private async _handleChatMessage(message: string, webview: vscode.Webview) {
        await this.chatService.handleChatMessage(message, webview);
    }

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
        // Validate that template files exist
        const validation = this.webviewService.validateTemplateFiles();
        if (!validation.valid) {
            console.warn('Missing template files:', validation.missingFiles);
        }

        return this.webviewService.generateHtmlFromTemplate(webview);
    }
}