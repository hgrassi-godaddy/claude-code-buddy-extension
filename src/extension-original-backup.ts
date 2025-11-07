import * as vscode from 'vscode';
import { PromptHistoryService, PromptEntry } from './promptHistoryService';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Buddy extension is now active!');

    // Create the webview provider
    const provider = new ClaudeBuddyViewProvider(context.extensionUri);

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('claudeBuddyPanel', provider),
        provider // Add provider to subscriptions so dispose is called
    );

    // Register command to open panel
    const disposable = vscode.commands.registerCommand('claude-buddy.openPanel', () => {
        vscode.window.showInformationMessage('Claude Buddy Panel Opening!');
    });

    context.subscriptions.push(disposable);
}

class ClaudeBuddyViewProvider implements vscode.WebviewViewProvider {
    private promptHistory: PromptHistoryService;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this.promptHistory = new PromptHistoryService();
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

        // Load and send initial prompts as user messages
        this._loadPromptsAsMessages(webviewView.webview);

        // Start watching for file changes (load new prompts as messages)
        this.promptHistory.startWatching((prompts) => {
            this._loadPromptsAsMessages(webviewView.webview);
        });

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'sendMessage':
                        // Handle chat messages here
                        this._handleChatMessage(message.text, webviewView.webview);
                        break;
                }
            },
            undefined,
            []
        );
    }

    private _handleChatMessage(message: string, webview: vscode.Webview) {
        // Simulate Claude Buddy response
        setTimeout(() => {
            webview.postMessage({
                command: 'receiveMessage',
                message: `Hey there! You said: "${message}". I'm Claude Buddy, your VS Code companion! 🤖`
            });
        }, 1000);
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
                    // Note: assistantReply functionality removed in current version
                    // if (prompt.assistantReply) {
                    //     conversationMessages.push({
                    //         type: 'assistant',
                    //         text: prompt.assistantReply.content,
                    //         timestamp: prompt.assistantReply.displayTime
                    //     });
                    // }
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

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Create a simplified version of Claude Buddy for the webview
        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Claude Buddy</title>
    <style>
        :root {
            --vscode-background: var(--vscode-editor-background, #1e1e1e);
            --vscode-foreground: var(--vscode-foreground, #cccccc);
            --vscode-input-background: var(--vscode-input-background, #3c3c3c);
            --vscode-input-border: var(--vscode-input-border, #5a5a5a);
            --vscode-button-background: var(--vscode-button-background, #0e639c);
            --vscode-button-foreground: var(--vscode-button-foreground, #ffffff);
        }

        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-background);
            color: var(--vscode-foreground);
            margin: 0;
            padding: 16px;
            height: 100vh;
            box-sizing: border-box;
            overflow: hidden;
        }

        .container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        /* Buddy Section - Optimized */
        .buddy-section {
            flex: 0 0 240px;
            text-align: center;
            padding: 8px 16px;
            border: 2px dashed var(--vscode-input-border);
            border-radius: 12px;
            margin-bottom: 16px;
            background: var(--vscode-input-background);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }

        .buddy-avatar {
            width: 180px;
            height: 190px;
            margin: 4px auto 8px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        /* Cyborg Animations */
        .cyborg-container {
            position: relative;
            width: 180px;
            height: 190px;
        }

        .cyborg-body {
            animation: cyborgFloat 3s ease-in-out infinite;
        }

        .cyborg-head {
            animation: cyborgBob 2.5s ease-in-out infinite;
        }

        .cyborg-eyes {
            animation: cyborgBlink 4s ease-in-out infinite;
        }

        .cyborg-hair {
            animation: hairSway 3.5s ease-in-out infinite;
        }

        .hair-style {
            display: none;
        }

        .hair-style.active {
            display: block;
        }

        .expression {
            display: none;
        }

        .expression.active {
            display: block;
        }

        .accessory {
            display: none;
        }

        .accessory.active {
            display: block;
        }

        .cyber-glow {
            animation: cyberPulse 2s ease-in-out infinite;
        }

        .cyberpunk-mode .cyber-glow {
            filter: drop-shadow(0 0 6px var(--cyber-color)) drop-shadow(0 0 12px var(--cyber-color));
        }

        .cyberpunk-mode .cyborg-body {
            filter: drop-shadow(0 0 15px var(--cyber-color, #9D00FF)) drop-shadow(0 0 30px var(--cyber-color, #9D00FF));
        }

        .cyberpunk-mode .cyborg-head {
            filter: drop-shadow(0 0 8px var(--cyber-color, #9D00FF));
        }

        .cyberpunk-mode .cyborg-eyes circle[fill*="#"] {
            filter: drop-shadow(0 0 4px var(--eye-color));
        }

        @keyframes cyborgFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
        }

        @keyframes cyborgBob {
            0%, 100% { transform: rotate(0deg); }
            30% { transform: rotate(1deg); }
            70% { transform: rotate(-1deg); }
        }

        @keyframes cyborgBlink {
            0%, 90%, 100% { opacity: 1; }
            95% { opacity: 0.2; }
        }

        @keyframes hairSway {
            0%, 100% { transform: translateX(0px) rotate(0deg); }
            50% { transform: translateX(1px) rotate(1deg); }
        }

        @keyframes cyberPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }

        /* Style Controls */
        .style-controls {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin: 8px 0;
            flex-wrap: wrap;
        }

        .style-btn {
            padding: 4px 8px;
            font-size: 10px;
            border-radius: 12px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-foreground);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .style-btn:hover {
            transform: scale(1.05);
            border-color: var(--vscode-button-background);
        }

        .style-btn.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }

        /* Color Picker Styles */
        .color-picker-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 8px 0;
        }

        .color-picker-label {
            font-size: 11px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }

        .color-picker {
            width: 100%;
            height: 40px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            cursor: pointer;
            padding: 4px;
        }

        .color-picker:hover {
            border-color: var(--vscode-button-background);
        }

        .color-picker::-webkit-color-swatch-wrapper {
            padding: 0;
            border-radius: 4px;
        }

        .color-picker::-webkit-color-swatch {
            border: none;
            border-radius: 4px;
        }

        /* Clothing System Styles */
        .top-style, .bottom-style, .shoe-style {
            display: none;
        }

        .top-style.active, .bottom-style.active, .shoe-style.active {
            display: block;
        }


        /* Navigation Interface */
        .customization-nav {
            margin: 8px 0;
        }

        .nav-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 0 4px;
        }

        .nav-arrow {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 20px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .nav-arrow:hover {
            opacity: 0.8;
            transform: scale(1.1);
        }

        .nav-arrow:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            transform: none;
        }

        .nav-title {
            font-size: 12px;
            font-weight: bold;
            min-width: 60px;
            text-align: center;
        }

        .customization-panel {
            display: none;
            animation: slideIn 0.3s ease;
        }

        .customization-panel.active {
            display: block;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
        }

        /* Color Controls */
        .color-controls {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin: 4px 0;
            flex-wrap: wrap;
            max-width: 120px;
            margin-left: auto;
            margin-right: auto;
        }

        .color-btn {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid var(--vscode-input-border);
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .color-btn:hover {
            transform: scale(1.2);
        }

        .color-btn.active {
            border-color: var(--vscode-button-background);
            box-shadow: 0 0 6px rgba(14, 99, 156, 0.5);
        }

        .buddy-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .buddy-status {
            font-size: 14px;
            opacity: 0.8;
        }

        /* Chat Section */
        .chat-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-background);
            margin-bottom: 12px;
        }

        .message {
            margin-bottom: 12px;
            display: flex;
        }

        .user-message {
            justify-content: flex-end;
        }

        .buddy-message {
            justify-content: flex-start;
        }

        .message-bubble {
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-wrap;
        }

        .user-message .message-bubble {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .buddy-message .message-bubble {
            background: var(--vscode-input-background);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-input-border);
        }

        .input-container {
            display: flex;
            gap: 8px;
        }

        #messageInput {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-foreground);
            font-family: inherit;
        }

        #sendButton {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
        }

        #sendButton:hover {
            opacity: 0.9;
        }


        /* Let's Code Button */
        .lets-code-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 2px solid var(--vscode-button-border);
            border-radius: 15px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            z-index: 10;
            pointer-events: none;
        }

        .buddy-avatar:hover .lets-code-button {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1.05);
        }

        .lets-code-button:hover {
            background: var(--vscode-button-hoverBackground);
            transform: scale(1.1);
        }

        .lets-code-button:active {
            transform: scale(0.95);
        }

        /* Coding Mode Styles */
        .coding-mode .customization-nav {
            display: none;
        }

        .coding-mode .customization-panel {
            display: none;
        }

        .coding-mode .chat-section {
            flex: 1;
            max-width: none;
        }

        .coding-mode .buddy-section {
            flex: 0 0 200px;
        }

        /* Buddy Header */
        .buddy-header {
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-widget-border);
            background: var(--vscode-sideBar-background);
        }

        .friendship-compact {
            display: flex;
            align-items: center;
            gap: 8px;
            position: relative;
            cursor: pointer;
        }

        .friendship-label {
            font-size: 11px;
            font-weight: bold;
            opacity: 0.8;
            flex-shrink: 0;
        }

        .friendship-bar-small {
            flex: 1;
            height: 4px;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            overflow: hidden;
        }

        .friendship-bar-small .friendship-progress {
            width: 0%;
            height: 100%;
            background: var(--vscode-progressBar-foreground);
            transition: width 0.5s ease;
        }

        /* Friendship Tooltip */
        .friendship-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            margin-bottom: 5px;
        }

        .friendship-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid var(--vscode-editorHoverWidget-border);
        }

        .friendship-compact:hover .friendship-tooltip {
            opacity: 1;
            visibility: visible;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Large Buddy Section -->
        <div class="buddy-section">
            <!-- Buddy Header with Friendship -->
            <div class="buddy-header">
                <div class="friendship-compact" id="friendshipCompact">
                    <span class="friendship-label">💖 Friendship 0%</span>
                    <div class="friendship-bar-small">
                        <div class="friendship-progress"></div>
                    </div>
                    <div class="friendship-tooltip" id="friendshipTooltip">Best Friends! 🌟</div>
                </div>
            </div>

            <div class="buddy-avatar">
                <div class="cyborg-container">
                    <svg width="180" height="190" viewBox="-10 0 140 150" class="cyborg-body">
                        <defs>
                            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:var(--skin-color, #F4C2A1);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:var(--skin-color, #F4C2A1);stop-opacity:0.8" />
                            </linearGradient>
                            <linearGradient id="jacketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:var(--jacket-color, #34495E);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:var(--jacket-color, #34495E);stop-opacity:0.7" />
                            </linearGradient>
                            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:var(--hair-color, #2C3E50);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:var(--hair-color, #2C3E50);stop-opacity:0.8" />
                            </linearGradient>
                        </defs>

                        <!-- Neck (shorter neck area) -->
                        <polygon points="55,50 65,50 66,60 64,60 56,60 54,60" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>

                        <!-- Body Shadow (Natural shape, shorter torso) -->
                        <polygon points="57,60 63,60 67,70 68,85 66,100 64,110 62,118 58,118 56,110 54,100 52,85 53,70" fill="url(#skinGradient)" opacity="0.2"/>

                        <!-- Base Body (Natural, tapered torso, shorter) -->
                        <polygon points="56,60 64,60 66,70 67,85 65,100 63,110 61,118 59,118 57,110 55,100 53,85 54,70" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>

                        <!-- Clothing System -->
                        <!-- Tops Layer -->
                        <g id="tops-layer">
                            <!-- Top Style 1: Tank Top -->
                            <g id="top-tanktop" class="top-style active">
                                <!-- Fully exposed arms (positioned inward for tank top, raised higher) -->
                                <polygon points="40,78 46,76 47,93 46,108 40,108 38,93" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <polygon points="74,76 80,78 82,93 80,108 74,108 73,93" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Tank top body (realistic athletic cut, shorter torso) -->
                                <polygon points="50,68 54,63 66,63 70,68 72,85 70,100 68,108 52,108 50,100 48,85"
                                      fill="var(--top-color, #3498DB)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                                <!-- Tank top armhole curves (natural cut) -->
                                <path d="M50,68 Q48,75 48,85" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <path d="M70,68 Q72,75 72,85" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Tank top neckline (athletic scoop) -->
                                <path d="M54,63 Q60,66 66,63" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Chest seam detail -->
                                <line x1="54" y1="75" x2="66" y2="75" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3" opacity="0.4"/>
                                <!-- Shoulder definition for exposed arms -->
                                <polygon points="42,86 45,88 44,92 42,90" fill="var(--outline-color, #2C3E50)" opacity="0.2"/>
                                <polygon points="78,86 75,88 76,92 78,90" fill="var(--outline-color, #2C3E50)" opacity="0.2"/>
                            </g>

                            <!-- Top Style 2: T-Shirt -->
                            <g id="top-tshirt" class="top-style">
                                <!-- T-shirt short sleeves (positioned closer to body, raised higher) -->
                                <polygon points="40,78 46,76 47,88 44,88 42,85 40,83" fill="var(--top-color, #E74C3C)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <polygon points="74,76 80,78 80,83 78,85 76,88 73,88 74,86" fill="var(--top-color, #E74C3C)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Exposed arms (positioned inward, lower part, raised higher) -->
                                <polygon points="42,85 46,88 47,93 46,108 40,108 38,93" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <polygon points="74,86 80,83 82,93 80,108 74,108 73,93" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- T-shirt body (fitted to natural shape, shorter torso) -->
                                <polygon points="46,68 50,65 70,65 74,68 76,85 74,100 72,108 48,108 46,100 44,85"
                                      fill="var(--top-color, #E74C3C)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                                <!-- T-shirt neckline -->
                                <path d="M50,65 Q60,68 70,65" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                            </g>

                            <!-- Top Style 3: Hoodie -->
                            <g id="top-hoodie" class="top-style">
                                <!-- Hoodie sleeves (full coverage, raised higher) -->
                                <polygon points="35,78 42,76 43,93 42,108 35,108 33,93" fill="var(--top-color, #9B59B6)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <polygon points="78,76 85,78 87,93 85,108 78,108 77,93" fill="var(--top-color, #9B59B6)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Hoodie body (fitted to natural shape, shorter torso) -->
                                <polygon points="44,68 50,63 70,63 76,68 78,85 76,100 74,108 46,108 44,100 42,85"
                                      fill="var(--top-color, #9B59B6)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                                <!-- Hood -->
                                <path d="M50,63 Q60,58 70,63" fill="var(--top-color, #9B59B6)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Hoodie strings -->
                                <circle cx="56" cy="68" r="0.8" fill="var(--outline-color, #2C3E50)"/>
                                <circle cx="64" cy="68" r="0.8" fill="var(--outline-color, #2C3E50)"/>
                                <!-- Front pocket -->
                                <rect x="50" y="88" width="20" height="8" rx="2" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5" opacity="0.6"/>
                                <!-- Hoodie cuffs -->
                                <rect x="33" y="112" width="10" height="4" rx="2" fill="var(--outline-color, #2C3E50)" opacity="0.4"/>
                                <rect x="77" y="112" width="10" height="4" rx="2" fill="var(--outline-color, #2C3E50)" opacity="0.4"/>
                            </g>

                            <!-- Top Style 4: Vest -->
                            <g id="top-vest" class="top-style">
                                <!-- Arms positioned closer for fitted vest (raised higher) -->
                                <polygon points="44,78 48,76 49,93 48,108 44,108 42,93" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <polygon points="72,76 76,78 78,93 76,108 72,108 71,93" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                                <!-- Vest body (tailored, close-fitting, shorter torso) -->
                                <polygon points="50,68 52,65 68,65 70,68 72,85 70,100 68,108 52,108 50,100 48,85"
                                      fill="var(--top-color, #8E44AD)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                                <!-- Vest armhole edges (fitted cut) -->
                                <path d="M50,68 Q48,75 48,85" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.6"/>
                                <path d="M70,68 Q72,75 72,85" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.6"/>
                                <!-- Vest buttons -->
                                <circle cx="60" cy="78" r="0.8" fill="var(--outline-color, #2C3E50)"/>
                                <circle cx="60" cy="88" r="0.8" fill="var(--outline-color, #2C3E50)"/>
                                <circle cx="60" cy="98" r="0.8" fill="var(--outline-color, #2C3E50)"/>
                                <!-- Shoulder definition for closer arms -->
                                <polygon points="46,86 48,88 47,92 46,90" fill="var(--outline-color, #2C3E50)" opacity="0.2"/>
                                <polygon points="74,86 72,88 73,92 74,90" fill="var(--outline-color, #2C3E50)" opacity="0.2"/>
                            </g>
                        </g>

                        <!-- Head Shadow (Angular, positioned higher) -->
                        <polygon points="45,30 75,30 77,42 73,57 67,60 53,60 47,57 43,42" fill="url(#skinGradient)" opacity="0.2"/>

                        <!-- Head (Sharp, defined jawline, higher position) -->
                        <g class="cyborg-head">
                            <polygon points="45,32 75,32 77,44 73,56 65,59 55,59 47,56 43,44" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>

                            <!-- Robot Antenna -->
                            <line x1="60" y1="32" x2="60" y2="20" stroke="var(--outline-color, #2C3E50)" stroke-width="2"/>
                            <circle cx="60" cy="20" r="3" fill="var(--accessory-color, #E74C3C)" stroke="var(--outline-color, #2C3E50)" stroke-width="1" class="cyber-glow"/>
                            <circle cx="60" cy="20" r="1.5" fill="#FF6B6B" opacity="0.8"/>

                            <!-- Defined cheekbones (adjusted for new head position) -->
                            <polygon points="47,46 53,48 51,52 47,50" fill="var(--outline-color, #2C3E50)" opacity="0.15"/>
                            <polygon points="73,46 67,48 69,52 73,50" fill="var(--outline-color, #2C3E50)" opacity="0.15"/>

                            <!-- Hair (Multiple styles - positioned correctly on head) -->
                            <g class="cyborg-hair" id="hair-layer">
                                <!-- Style 1: Bald (no hair) -->
                                <g id="hair-style-1" class="hair-style active">
                                    <!-- No hair - just the head -->
                                </g>

                                <!-- Style 2: Spiky Punk (positioned on head) -->
                                <g id="hair-style-2" class="hair-style">
                                    <polygon points="43,33 49,26 55,29 60,23 65,29 71,26 77,33 75,37 73,41 67,35 60,33 53,35 47,41 45,37"
                                             fill="url(#hairGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                                    <!-- Spiky strands (positioned properly) -->
                                    <polygon points="50,27 52,21 54,27" fill="var(--hair-color, #2C3E50)" opacity="0.8"/>
                                    <polygon points="58,23 60,17 62,23" fill="var(--hair-color, #2C3E50)" opacity="0.8"/>
                                    <polygon points="66,27 68,21 70,27" fill="var(--hair-color, #2C3E50)" opacity="0.8"/>
                                    <!-- Side spikes -->
                                    <polygon points="45,37 48,33 50,37" fill="var(--hair-color, #2C3E50)" opacity="0.6"/>
                                    <polygon points="75,37 72,33 70,37" fill="var(--hair-color, #2C3E50)" opacity="0.6"/>
                                </g>

                                <!-- Style 3: Long Hair (positioned on head, thicker strands) -->
                                <g id="hair-style-3" class="hair-style">
                                    <!-- Top hair (positioned to cover head properly) -->
                                    <polygon points="43,33 51,27 60,29 69,27 77,33 79,37 75,43 73,41 71,35 60,33 49,35 47,41 45,43 41,37"
                                             fill="url(#hairGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>

                                    <!-- LEFT SIDE HAIR (thicker strands, connected to head position) -->
                                    <path d="M43,37 Q38,51 35,71 Q33,86 30,96" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="3.5" opacity="1"/>
                                    <path d="M43,37 Q38,51 35,71 Q33,86 30,96" fill="none" stroke="var(--hair-color, #2C3E50)" stroke-width="2.2" opacity="0.9"/>

                                    <path d="M41,39 Q36,53 33,73 Q31,88 28,98" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="3" opacity="1"/>
                                    <path d="M41,39 Q36,53 33,73 Q31,88 28,98" fill="none" stroke="var(--hair-color, #2C3E50)" stroke-width="1.8" opacity="0.8"/>

                                    <!-- RIGHT SIDE HAIR (thicker strands, connected to head position) -->
                                    <path d="M77,37 Q82,51 85,71 Q87,86 90,96" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="3.5" opacity="1"/>
                                    <path d="M77,37 Q82,51 85,71 Q87,86 90,96" fill="none" stroke="var(--hair-color, #2C3E50)" stroke-width="2.2" opacity="0.9"/>

                                    <path d="M79,39 Q84,53 87,73 Q89,88 92,98" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="3" opacity="1"/>
                                    <path d="M79,39 Q84,53 87,73 Q89,88 92,98" fill="none" stroke="var(--hair-color, #2C3E50)" stroke-width="1.8" opacity="0.8"/>

                                    <!-- Volume at top (positioned to match head) -->
                                    <polygon points="53,31 57,28 63,28 67,31 65,35 55,35" fill="var(--hair-color, #2C3E50)" opacity="0.3"/>
                                </g>

                                <!-- Style 4: Clean Cut (professional, well-groomed) -->
                                <g id="hair-style-4" class="hair-style">
                                    <!-- Main hair shape - neat and tidy -->
                                    <polygon points="46,32 52,26 60,24 68,26 74,32 76,36 74,40 70,38 66,36 60,32 54,36 50,38 46,40 44,36"
                                             fill="url(#hairGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                                    <!-- Clean parting line -->
                                    <line x1="58" y1="26" x2="60" y2="36" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8" opacity="0.6"/>
                                    <!-- Neat side styling -->
                                    <polygon points="46,34 50,32 52,36 48,38" fill="var(--hair-color, #2C3E50)" opacity="0.2"/>
                                    <polygon points="74,34 70,32 68,36 72,38" fill="var(--hair-color, #2C3E50)" opacity="0.2"/>
                                    <!-- Professional volume at top -->
                                    <polygon points="52,27 58,25 62,25 68,27 66,31 54,31" fill="var(--hair-color, #2C3E50)" opacity="0.3"/>
                                </g>
                            </g>

                            <!-- Eyes (Angular, sharp, repositioned to new head) -->
                            <g class="cyborg-eyes">
                                <polygon points="50.5,39 57.5,39 58,44 57.5,49 50.5,49 50,44" fill="white"/>
                                <polygon points="62.5,39 69.5,39 70,44 69.5,49 62.5,49 62,44" fill="white"/>
                                <polygon points="51.8,42 56.2,42 56.5,44.5 56.2,47 51.8,47 51.5,44.5" fill="var(--eye-color, #3498DB)"/>
                                <polygon points="63.8,42 68.2,42 68.5,44.5 68.2,47 63.8,47 63.5,44.5" fill="var(--eye-color, #3498DB)"/>
                                <polygon points="53.7,42.5 55.3,42.5 55.5,43.5 55.3,44.5 53.7,44.5 53.5,43.5" fill="white"/>
                                <polygon points="65.7,42.5 67.3,42.5 67.5,43.5 67.3,44.5 65.7,44.5 65.5,43.5" fill="white"/>
                                <!-- Sharp eyelids -->
                                <polygon points="50.5,40 57.5,40 57,41 51,41" fill="var(--outline-color, #2C3E50)" opacity="0.3"/>
                                <polygon points="62.5,40 69.5,40 69,41 63,41" fill="var(--outline-color, #2C3E50)" opacity="0.3"/>
                            </g>

                            <!-- Nose (Sharp, defined, repositioned to new head) -->
                            <polygon points="59,47 61,47 61.5,49 61,51 59,51 58.5,49" fill="var(--outline-color, #2C3E50)" opacity="0.3"/>

                            <!-- Cybernetic Implants (Angular tech, repositioned to new head) -->
                            <g id="cyber-layer">
                                <polygon points="71,41 76,41 76,47 71,47" fill="var(--cyber-color, #E74C3C)" class="cyber-glow"/>
                                <polygon points="72.5,39 73.5,39 73.5,41 72.5,41" fill="var(--cyber-color, #E74C3C)"/>
                                <polygon points="72.7,37.2 74.3,37.2 74.3,38.8 72.7,38.8" fill="var(--cyber-color, #E74C3C)" class="cyber-glow"/>
                                <!-- Additional tech details -->
                                <rect x="72" y="42.5" width="3" height="1" fill="var(--cyber-color, #E74C3C)" opacity="0.7"/>
                                <rect x="72" y="44" width="3" height="1" fill="var(--cyber-color, #E74C3C)" opacity="0.7"/>
                                <polygon points="71.5,45.5 75.5,45.5 75,46.5 72,46.5" fill="var(--cyber-color, #E74C3C)" opacity="0.5"/>
                            </g>

                            <!-- Glasses Layer (Angular frames, repositioned to new head) -->
                            <g id="glasses-layer" style="display: none;">
                                <polygon points="48,40 58,40 58,48 48,48" fill="none" stroke="var(--glasses-color, #2C3E50)" stroke-width="1.5"/>
                                <polygon points="62,40 72,40 72,48 62,48" fill="none" stroke="var(--glasses-color, #2C3E50)" stroke-width="1.5"/>
                                <line x1="58" y1="44" x2="62" y2="44" stroke="var(--glasses-color, #2C3E50)" stroke-width="1.5"/>
                                <!-- Angular temple arms -->
                                <polygon points="48,42 44,40 44,41 48,43" fill="var(--glasses-color, #2C3E50)"/>
                                <polygon points="72,42 76,40 76,41 72,43" fill="var(--glasses-color, #2C3E50)"/>
                            </g>

                            <!-- Mouth (Sharp, defined, repositioned to new head) -->
                            <g id="mouth-layer">
                                <!-- Neutral mouth (default) -->
                                <g id="mouth-neutral" class="expression active">
                                    <polygon points="57.5,52 62.5,52 62.5,54 57.5,54" fill="var(--mouth-color, #D2691E)" opacity="0.8"/>
                                    <polygon points="58.5,53 61.5,53 61,53.5 59,53.5" fill="var(--outline-color, #2C3E50)" opacity="0.2"/>
                                </g>
                                <!-- Happy mouth -->
                                <g id="mouth-happy" class="expression">
                                    <path d="M57,52 Q60,55 63,52" fill="none" stroke="var(--mouth-color, #D2691E)" stroke-width="2"/>
                                    <polygon points="57,52 63,52 62,54 58,54" fill="var(--mouth-color, #D2691E)" opacity="0.6"/>
                                </g>
                                <!-- Excited mouth -->
                                <g id="mouth-excited" class="expression">
                                    <ellipse cx="60" cy="53" rx="4" ry="3" fill="var(--mouth-color, #D2691E)"/>
                                    <ellipse cx="60" cy="53" rx="2" ry="1.5" fill="white" opacity="0.8"/>
                                </g>
                                <!-- Focused mouth -->
                                <g id="mouth-focused" class="expression">
                                    <line x1="58" y1="53" x2="62" y2="53" stroke="var(--mouth-color, #D2691E)" stroke-width="1.5"/>
                                </g>
                                <!-- Sleepy mouth -->
                                <g id="mouth-sleepy" class="expression">
                                    <ellipse cx="60" cy="53" rx="1.5" ry="2" fill="var(--mouth-color, #D2691E)" opacity="0.6"/>
                                </g>
                            </g>

                            <!-- Accessories Layer (repositioned for new head/neck) -->
                            <g id="accessories-layer">
                                <!-- Glasses (on face) -->
                                <g id="accessory-glasses" class="accessory">
                                    <!-- Left lens -->
                                    <circle cx="52" cy="45" r="6" fill="none" stroke="var(--glasses-color, #E74C3C)" stroke-width="2" class="cyber-glow"/>
                                    <!-- Right lens -->
                                    <circle cx="68" cy="45" r="6" fill="none" stroke="var(--glasses-color, #E74C3C)" stroke-width="2" class="cyber-glow"/>
                                    <!-- Bridge -->
                                    <line x1="58" y1="45" x2="62" y2="45" stroke="var(--glasses-color, #E74C3C)" stroke-width="2"/>
                                    <!-- Left arm -->
                                    <line x1="46" y1="45" x2="42" y2="48" stroke="var(--glasses-color, #E74C3C)" stroke-width="2"/>
                                    <!-- Right arm -->
                                    <line x1="74" y1="45" x2="78" y2="48" stroke="var(--glasses-color, #E74C3C)" stroke-width="2"/>
                                </g>

                                <!-- Earrings (positioned near ears) -->
                                <g id="accessory-earrings" class="accessory">
                                    <circle cx="44" cy="50" r="2" fill="var(--earrings-color, #FFD700)" class="cyber-glow"/>
                                    <circle cx="76" cy="50" r="2" fill="var(--earrings-color, #FFD700)" class="cyber-glow"/>
                                </g>

                                <!-- Cat Pet (by the right foot) -->
                                <g id="accessory-cat" class="accessory">
                                    <!-- Cat body -->
                                    <ellipse cx="75" cy="140" rx="8" ry="6" fill="var(--cat-color, #FF8C42)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                                    <!-- Cat head -->
                                    <circle cx="75" cy="128" r="5" fill="var(--cat-color, #FF8C42)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                                    <!-- Cat ears -->
                                    <polygon points="71,124 73,120 75,124" fill="var(--cat-color, #FF8C42)"/>
                                    <polygon points="75,124 77,120 79,124" fill="var(--cat-color, #FF8C42)"/>
                                    <!-- Cat tail -->
                                    <path d="M67,142 Q62,135 65,128" fill="none" stroke="var(--cat-color, #FF8C42)" stroke-width="3" stroke-linecap="round"/>
                                    <!-- Cat eyes -->
                                    <circle cx="73" cy="127" r="1" fill="var(--outline-color, #2C3E50)"/>
                                    <circle cx="77" cy="127" r="1" fill="var(--outline-color, #2C3E50)"/>
                                </g>

                                <!-- Dog Pet (by the left foot) -->
                                <g id="accessory-dog" class="accessory">
                                    <!-- Dog body (side profile shape) -->
                                    <ellipse cx="45" cy="140" rx="10" ry="6" fill="var(--dog-color, #8B4513)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.6"/>

                                    <!-- Dog neck -->
                                    <ellipse cx="38" cy="130" rx="3" ry="4" fill="var(--dog-color, #8B4513)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.6"/>

                                    <!-- Dog head (proper profile shape) -->
                                    <ellipse cx="34" cy="125" rx="4" ry="5" fill="var(--dog-color, #8B4513)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.6"/>

                                    <!-- Dog muzzle/snout (realistic length) -->
                                    <ellipse cx="28" cy="127" rx="4" ry="2.5" fill="var(--dog-color, #8B4513)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.6"/>

                                    <!-- Dog ears (properly drooping) -->
                                    <ellipse cx="36" cy="121" rx="2.5" ry="5" fill="var(--dog-color, #8B4513)" transform="rotate(-20 36 121)"/>
                                    <ellipse cx="33" cy="120" rx="2" ry="4" fill="var(--dog-color, #8B4513)" transform="rotate(-40 33 120)"/>

                                    <!-- Dog legs (realistic positioning) -->
                                    <ellipse cx="38" cy="147" rx="1.5" ry="4" fill="var(--dog-color, #8B4513)"/>
                                    <ellipse cx="42" cy="147" rx="1.5" ry="4" fill="var(--dog-color, #8B4513)"/>
                                    <ellipse cx="48" cy="147" rx="1.5" ry="4" fill="var(--dog-color, #8B4513)"/>
                                    <ellipse cx="52" cy="147" rx="1.5" ry="4" fill="var(--dog-color, #8B4513)"/>

                                    <!-- Dog paws -->
                                    <ellipse cx="38" cy="151" rx="2" ry="1" fill="var(--outline-color, #2C3E50)"/>
                                    <ellipse cx="42" cy="151" rx="2" ry="1" fill="var(--outline-color, #2C3E50)"/>
                                    <ellipse cx="48" cy="151" rx="2" ry="1" fill="var(--outline-color, #2C3E50)"/>
                                    <ellipse cx="52" cy="151" rx="2" ry="1" fill="var(--outline-color, #2C3E50)"/>

                                    <!-- Dog tail (happy wagging position) -->
                                    <path d="M55,138 Q60,133 58,125 Q56,118 60,115" fill="none" stroke="var(--dog-color, #8B4513)" stroke-width="3" stroke-linecap="round"/>

                                    <!-- Dog eye (single eye visible in profile) -->
                                    <circle cx="32" cy="123" r="1.5" fill="var(--outline-color, #2C3E50)"/>
                                    <circle cx="32.5" cy="122.5" r="0.5" fill="white"/>

                                    <!-- Dog nose (black nose) -->
                                    <circle cx="25" cy="126.5" r="1" fill="var(--outline-color, #2C3E50)"/>

                                    <!-- Dog mouth (happy expression) -->
                                    <path d="M26,128 Q28,130 32,129" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8" stroke-linecap="round"/>

                                    <!-- Dog tongue (hanging out happily) -->
                                    <ellipse cx="29" cy="131" rx="1.5" ry="0.8" fill="#FF69B4" opacity="0.8"/>
                                </g>
                            </g>
                        </g>

                        <!-- Arms are now handled by each clothing style for proper sleeve coverage -->

                        <!-- Bottoms Layer -->
                        <g id="bottoms-layer">
                            <!-- Bottom Style 1: Dress Pants (Proper width) -->
                            <g id="bottom-pants" class="bottom-style active">
                                <polygon points="52,108 68,108 68,142 52,142" fill="var(--bottom-color, #2C3E50)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3"/>
                                <polygon points="52,108 58,108 58,142 52,142" fill="var(--bottom-color, #2C3E50)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3"/>
                                <polygon points="62,108 68,108 68,142 62,142" fill="var(--bottom-color, #2C3E50)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3"/>
                                <line x1="60" y1="108" x2="60" y2="142" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3" opacity="0.4"/>
                            </g>

                            <!-- Bottom Style 2: Skirt (Proper width, shorter) -->
                            <g id="bottom-skirt" class="bottom-style">
                                <polygon points="52,108 68,108 68,125 52,125" fill="var(--bottom-color, #E91E63)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3"/>
                                <polygon points="52,125 58,125 58,142 52,142" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3"/>
                                <polygon points="62,125 68,125 68,142 62,142" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.3"/>
                            </g>
                        </g>

                        <!-- Shoes Layer -->
                        <g id="shoes-layer">
                            <!-- Simple Shoes -->
                            <ellipse cx="55" cy="143" rx="4" ry="2" fill="var(--shoe-color, #1A1A1A)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                            <ellipse cx="65" cy="143" rx="4" ry="2" fill="var(--shoe-color, #1A1A1A)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                        </g>
                    </svg>
                </div>
                <button class="lets-code-button" id="letscodeBtn">Let's Code!</button>
            </div>

            <!-- Navigation Interface -->
            <div class="customization-nav">
                <div class="nav-header">
                    <button class="nav-arrow" id="prevBtn">‹</button>
                    <span class="nav-title" id="navTitle">Style</span>
                    <button class="nav-arrow" id="nextBtn">›</button>
                </div>

                <!-- Style Panel -->
                <div class="customization-panel active" id="stylePanel">
                    <div class="style-controls">
                        <div class="style-btn active" data-style="cyberpunk">🌃 Cyber</div>
                        <div class="style-btn" data-style="academic">🎓 Academic</div>
                        <div class="style-btn" data-style="casual">👕 Casual</div>
                    </div>
                </div>

                <!-- Skin Color Panel -->
                <div class="customization-panel" id="skinPanel">
                    <div class="color-picker-container">
                        <input type="color" id="skinColorPicker" value="#C0C0C0" class="color-picker">
                    </div>
                </div>

                <!-- Hair Panel (Styles + Color Picker) -->
                <div class="customization-panel" id="hairPanel">
                    <!-- Hair Style Controls -->
                    <div class="style-controls" style="margin-bottom: 8px;">
                        <div class="style-btn active" data-hair-style="1" style="font-size: 10px;">Bald</div>
                        <div class="style-btn" data-hair-style="2" style="font-size: 10px;">Spiky</div>
                        <div class="style-btn" data-hair-style="3" style="font-size: 10px;">Long</div>
                        <div class="style-btn" data-hair-style="4" style="font-size: 10px;">Clean Cut</div>
                    </div>
                    <!-- Hair Color Picker -->
                    <div class="color-picker-container">
                        <input type="color" id="hairColorPicker" value="#8B4513" class="color-picker">
                    </div>
                </div>

                <!-- Eye Color Panel -->
                <div class="customization-panel" id="eyePanel">
                    <div class="color-picker-container">
                        <input type="color" id="eyeColorPicker" value="#ec4899" class="color-picker">
                    </div>
                </div>

                <!-- Accessories Panel -->
                <div class="customization-panel" id="accessoryPanel">
                    <div class="style-controls" style="margin-bottom: 8px;">
                        <div class="style-btn" data-accessory="glasses" style="font-size: 10px;">Glasses</div>
                        <div class="style-btn" data-accessory="earrings" style="font-size: 10px;">Earrings</div>
                        <div class="style-btn" data-accessory="cat" style="font-size: 10px;">Cat</div>
                        <div class="style-btn" data-accessory="dog" style="font-size: 10px;">Dog</div>
                    </div>
                    <!-- Individual Color Pickers -->
                    <div class="color-picker-container">
                        <div id="glasses-color-picker" class="individual-color-picker" style="display: none; margin-bottom: 4px;">
                            <label style="font-size: 10px; color: var(--vscode-foreground);">Glasses:</label>
                            <input type="color" id="glassesColorPicker" value="#E74C3C" class="color-picker">
                        </div>
                        <div id="earrings-color-picker" class="individual-color-picker" style="display: none; margin-bottom: 4px;">
                            <label style="font-size: 10px; color: var(--vscode-foreground);">Earrings:</label>
                            <input type="color" id="earringsColorPicker" value="#FFD700" class="color-picker">
                        </div>
                        <div id="cat-color-picker" class="individual-color-picker" style="display: none; margin-bottom: 4px;">
                            <label style="font-size: 10px; color: var(--vscode-foreground);">Cat:</label>
                            <input type="color" id="catColorPicker" value="#FF8C42" class="color-picker">
                        </div>
                        <div id="dog-color-picker" class="individual-color-picker" style="display: none; margin-bottom: 4px;">
                            <label style="font-size: 10px; color: var(--vscode-foreground);">Dog:</label>
                            <input type="color" id="dogColorPicker" value="#8B4513" class="color-picker">
                        </div>
                    </div>
                </div>

                <!-- Tops Panel -->
                <div class="customization-panel" id="topPanel">
                    <div class="style-controls" style="margin-bottom: 8px;">
                        <div class="style-btn active" data-top="tanktop" style="font-size: 10px;">Tank Top</div>
                        <div class="style-btn" data-top="tshirt" style="font-size: 10px;">T-Shirt</div>
                        <div class="style-btn" data-top="hoodie" style="font-size: 10px;">Hoodie</div>
                        <div class="style-btn" data-top="vest" style="font-size: 10px;">Vest</div>
                    </div>
                    <div class="color-picker-container">
                        <input type="color" id="topColorPicker" value="#3498DB" class="color-picker">
                    </div>
                </div>

                <!-- Bottoms Panel -->
                <div class="customization-panel" id="bottomPanel">
                    <div class="style-controls" style="margin-bottom: 8px;">
                        <div class="style-btn active" data-bottom="pants" style="font-size: 10px;">Pants</div>
                        <div class="style-btn" data-bottom="skirt" style="font-size: 10px;">Skirt</div>
                    </div>
                    <div class="color-picker-container">
                        <input type="color" id="bottomColorPicker" value="#2C3E50" class="color-picker">
                    </div>
                </div>

                <!-- Shoes Panel -->
                <div class="customization-panel" id="shoePanel">
                    <div class="color-picker-container">
                        <input type="color" id="shoeColorPicker" value="#1A1A1A" class="color-picker">
                    </div>
                </div>

                <!-- Expression Panel -->
                <div class="customization-panel" id="expressionPanel">
                    <div class="style-controls">
                        <div class="style-btn active" data-expression="neutral" style="font-size: 10px;">😐 Neutral</div>
                        <div class="style-btn" data-expression="happy" style="font-size: 10px;">😊 Happy</div>
                        <div class="style-btn" data-expression="excited" style="font-size: 10px;">🤩 Excited</div>
                        <div class="style-btn" data-expression="focused" style="font-size: 10px;">🤔 Focused</div>
                        <div class="style-btn" data-expression="sleepy" style="font-size: 10px;">😴 Sleepy</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Section -->
        <div class="chat-section">
            <div id="messages" class="messages"></div>
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Message Buddy..." maxlength="500">
                <button id="sendButton">Send</button>
            </div>
        </div>

    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Style themes for cyborg customization
        const styleThemes = {
            cyberpunk: {
                jacket: '#0A0A0A',
                hair: '#9D00FF',
                eye: '#9D00FF',
                cyber: '#9D00FF',
                glasses: false,
                pants: '#1A0033',
                jacketGlow: true,
                outline: '#9D00FF'
            },
            academic: {
                jacket: '#8B4513',
                hair: '#654321',
                eye: '#4A90E2',
                cyber: '#FFD700',
                glasses: true,
                pants: '#2F4F4F',
                jacketGlow: false,
                outline: '#2C3E50'
            },
            casual: {
                jacket: '#4169E1',
                hair: '#8B4513',
                eye: '#228B22',
                cyber: '#FF6347',
                glasses: false,
                pants: '#000080',
                jacketGlow: false,
                outline: '#2C3E50'
            }
        };

        // Expanded skin color options
        const skinColors = {
            fair: '#FDBCB4',
            light: '#F4C2A1',
            medium: '#D4A574',
            olive: '#C19A6B',
            dark: '#8B4513',
            deep: '#654321',
            silver: '#C0C0C0',
            purple: '#8A2BE2'
        };

        // Hair color options
        const hairColors = {
            brown: '#8B4513',
            black: '#000000',
            blonde: '#FFD700',
            red: '#DC143C',
            white: '#F5F5F5',
            blue: '#4169E1',
            purple: '#8A2BE2',
            cyan: '#00FFFF'
        };

        // Eye color options
        const eyeColors = {
            blue: '#3498DB',
            green: '#27AE60',
            brown: '#8B4513',
            amber: '#FFBF00',
            gray: '#708090',
            violet: '#8A2BE2',
            red: '#FF0000',
            cyan: '#00FFFF'
        };

        // Navigation state
        const customizationPanels = ['stylePanel', 'skinPanel', 'hairPanel', 'eyePanel', 'accessoryPanel', 'topPanel', 'bottomPanel', 'shoePanel', 'expressionPanel'];
        const panelTitles = ['Style', 'Skin', 'Hair', 'Eyes', 'Accessories', 'Tops', 'Bottoms', 'Shoes', 'Expression'];
        let currentPanelIndex = 0;

        // Set up style changing functionality
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.style;
                if (style && styleThemes[style]) {
                    changeCharacterStyle(style);

                    // Update active button
                    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up navigation
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const navTitle = document.getElementById('navTitle');

        function showPanel(index) {
            // Hide all panels
            customizationPanels.forEach(panelId => {
                document.getElementById(panelId).classList.remove('active');
            });

            // Show current panel
            document.getElementById(customizationPanels[index]).classList.add('active');
            navTitle.textContent = panelTitles[index];

            // Update arrow states
            prevBtn.disabled = index === 0;
            nextBtn.disabled = index === customizationPanels.length - 1;
        }

        prevBtn.addEventListener('click', () => {
            if (currentPanelIndex > 0) {
                currentPanelIndex--;
                showPanel(currentPanelIndex);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentPanelIndex < customizationPanels.length - 1) {
                currentPanelIndex++;
                showPanel(currentPanelIndex);
            }
        });

        // Let's Code Button functionality
        const letscodeBtn = document.getElementById('letscodeBtn');
        if (letscodeBtn) {
            letscodeBtn.addEventListener('click', () => {
                const container = document.querySelector('.container');

                // Toggle coding mode
                if (container.classList.contains('coding-mode')) {
                    // Exit coding mode - show customization panels
                    container.classList.remove('coding-mode');
                    letscodeBtn.textContent = "Let's Code!";
                } else {
                    // Enter coding mode - hide customization panels
                    container.classList.add('coding-mode');
                    letscodeBtn.textContent = "Let's Customize!";
                }
            });
        }

        // Set up skin color changing
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (color && skinColors[color]) {
                    changeSkinColor(color);

                    // Update active button within skin panel
                    document.querySelectorAll('#skinPanel .color-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up hair style changing
        document.querySelectorAll('[data-hair-style]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.hairStyle;
                if (style) {
                    changeHairStyle(style);

                    // Update active button within hair style controls
                    document.querySelectorAll('[data-hair-style]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up hair color changing
        document.querySelectorAll('[data-hair]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.hair;
                if (color && hairColors[color]) {
                    changeHairColor(color);

                    // Update active button within hair panel
                    document.querySelectorAll('#hairPanel .color-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up eye color changing
        document.querySelectorAll('[data-eye]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.eye;
                if (color && eyeColors[color]) {
                    changeEyeColor(color);

                    // Update active button within eye panel
                    document.querySelectorAll('#eyePanel .color-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up accessory toggling (multiple selection)
        document.querySelectorAll('[data-accessory]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accessory = e.target.dataset.accessory;
                if (accessory) {
                    toggleAccessory(accessory);

                    // Toggle active button state (allows multiple active buttons)
                    e.target.classList.toggle('active');
                }
            });
        });

        // Set up expression changing
        document.querySelectorAll('[data-expression]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const expression = e.target.dataset.expression;
                if (expression) {
                    changeExpression(expression);

                    // Update active button within expression panel
                    document.querySelectorAll('[data-expression]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up clothing style changing
        document.querySelectorAll('[data-top]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const top = e.target.dataset.top;
                if (top) {
                    changeTopStyle(top);

                    // Update active button within top panel
                    document.querySelectorAll('[data-top]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        document.querySelectorAll('[data-bottom]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bottom = e.target.dataset.bottom;
                if (bottom) {
                    changeBottomStyle(bottom);

                    // Update active button within bottom panel
                    document.querySelectorAll('[data-bottom]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        document.querySelectorAll('[data-shoe]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shoe = e.target.dataset.shoe;
                if (shoe) {
                    changeShoeStyle(shoe);

                    // Update active button within shoe panel
                    document.querySelectorAll('[data-shoe]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Set up color picker event listeners
        const skinColorPicker = document.getElementById('skinColorPicker');
        const hairColorPicker = document.getElementById('hairColorPicker');
        const eyeColorPicker = document.getElementById('eyeColorPicker');

        if (skinColorPicker) {
            skinColorPicker.addEventListener('change', (e) => {
                changeSkinColorHex(e.target.value);
            });
        }

        if (hairColorPicker) {
            hairColorPicker.addEventListener('change', (e) => {
                changeHairColorHex(e.target.value);
            });
        }

        if (eyeColorPicker) {
            eyeColorPicker.addEventListener('change', (e) => {
                changeEyeColorHex(e.target.value);
            });
        }

        const accessoryColorPicker = document.getElementById('accessoryColorPicker');
        if (accessoryColorPicker) {
            accessoryColorPicker.addEventListener('change', (e) => {
                changeAccessoryColorHex(e.target.value);
            });
        }

        // Individual accessory color pickers
        const glassesColorPicker = document.getElementById('glassesColorPicker');
        if (glassesColorPicker) {
            glassesColorPicker.addEventListener('change', (e) => {
                changeGlassesColorHex(e.target.value);
            });
        }

        const earringsColorPicker = document.getElementById('earringsColorPicker');
        if (earringsColorPicker) {
            earringsColorPicker.addEventListener('change', (e) => {
                changeEarringsColorHex(e.target.value);
            });
        }

        const catColorPicker = document.getElementById('catColorPicker');
        if (catColorPicker) {
            catColorPicker.addEventListener('change', (e) => {
                changeCatColorHex(e.target.value);
            });
        }

        const dogColorPicker = document.getElementById('dogColorPicker');
        if (dogColorPicker) {
            dogColorPicker.addEventListener('change', (e) => {
                changeDogColorHex(e.target.value);
            });
        }

        // Clothing color pickers
        const topColorPicker = document.getElementById('topColorPicker');
        const bottomColorPicker = document.getElementById('bottomColorPicker');
        const shoeColorPicker = document.getElementById('shoeColorPicker');

        if (topColorPicker) {
            topColorPicker.addEventListener('change', (e) => {
                changeTopColorHex(e.target.value);
            });
        }

        if (bottomColorPicker) {
            bottomColorPicker.addEventListener('change', (e) => {
                changeBottomColorHex(e.target.value);
            });
        }

        if (shoeColorPicker) {
            shoeColorPicker.addEventListener('change', (e) => {
                changeShoeColorHex(e.target.value);
            });
        }

        function changeCharacterStyle(styleName) {
            const theme = styleThemes[styleName];
            const root = document.documentElement;

            root.style.setProperty('--jacket-color', theme.jacket);
            root.style.setProperty('--hair-color', theme.hair);
            root.style.setProperty('--eye-color', theme.eye);
            root.style.setProperty('--cyber-color', theme.cyber);
            root.style.setProperty('--pants-color', theme.pants);
            root.style.setProperty('--outline-color', theme.outline || '#2C3E50');

            // Update color picker values to match theme
            const hairColorPicker = document.getElementById('hairColorPicker');
            const eyeColorPicker = document.getElementById('eyeColorPicker');

            if (hairColorPicker) {
                hairColorPicker.value = theme.hair;
            }
            if (eyeColorPicker) {
                eyeColorPicker.value = theme.eye;
            }

            // Show/hide glasses
            const glasses = document.getElementById('glasses-layer');
            if (glasses) {
                glasses.style.display = theme.glasses ? 'block' : 'none';
            }

            // Handle accessory glasses conflict with academic expression
            const glassesButton = document.querySelector('[data-accessory="glasses"]');

            if (styleName === 'academic') {
                // Hide accessory glasses and color picker when switching to academic
                const accessoryGlasses = document.getElementById('accessory-glasses');
                const glassesColorPicker = document.getElementById('glasses-color-picker');

                if (accessoryGlasses) {
                    accessoryGlasses.classList.remove('active');
                }
                if (glassesColorPicker) {
                    glassesColorPicker.style.display = 'none';
                }
                if (glassesButton) {
                    glassesButton.classList.remove('active');
                    glassesButton.style.opacity = '0.5';
                    glassesButton.style.pointerEvents = 'none';
                    glassesButton.title = 'Glasses already included in Academic expression';
                }
            } else {
                // Re-enable glasses button for other expressions
                if (glassesButton) {
                    glassesButton.style.opacity = '1';
                    glassesButton.style.pointerEvents = 'auto';
                    glassesButton.title = '';
                }
            }

            // Apply cyberpunk glow effects
            const jacket = document.getElementById('jacket-layer');
            const cyborgBody = document.querySelector('.cyborg-body');
            const cyberLayer = document.getElementById('cyber-layer');
            const antenna = cyborgBody?.querySelector('.cyborg-head circle[class*="cyber-glow"]');

            if (theme.jacketGlow && styleName === 'cyberpunk') {
                if (jacket) jacket.style.filter = 'drop-shadow(0 0 8px ' + theme.cyber + ')';
                if (cyborgBody) {
                    cyborgBody.classList.add('cyberpunk-mode');
                }
                if (cyberLayer) cyberLayer.style.filter = 'drop-shadow(0 0 6px ' + theme.cyber + ')';
            } else {
                if (jacket) jacket.style.filter = 'none';
                if (cyborgBody) cyborgBody.classList.remove('cyberpunk-mode');
                if (cyberLayer) cyberLayer.style.filter = 'none';
            }

            // Update status text based on theme
            const status = document.querySelector('.buddy-status');
            if (status) {
                const statusTexts = {
                    cyberpunk: 'System online!',
                    academic: 'Ready to learn!',
                    casual: 'Ready to help!'
                };
                status.textContent = statusTexts[styleName] || 'Ready to help!';
            }

            // Trigger animation restart
            triggerHappyAnimation();
        }

        function changeSkinColor(colorName) {
            const color = skinColors[colorName];
            const root = document.documentElement;
            root.style.setProperty('--skin-color', color);

            triggerHappyAnimation();
        }

        function changeHairColor(colorName) {
            const color = hairColors[colorName];
            const root = document.documentElement;
            root.style.setProperty('--hair-color', color);

            triggerHappyAnimation();
        }

        function changeHairStyle(styleNumber) {
            // Hide all hair styles
            document.querySelectorAll('.hair-style').forEach(style => {
                style.classList.remove('active');
            });

            // Show selected hair style
            const selectedStyle = document.getElementById(\`hair-style-\${styleNumber}\`);
            if (selectedStyle) {
                selectedStyle.classList.add('active');
            }

            triggerHappyAnimation();
        }

        function changeEyeColor(colorName) {
            const color = eyeColors[colorName];
            const root = document.documentElement;
            root.style.setProperty('--eye-color', color);

            triggerHappyAnimation();
        }

        // Color picker functions for hex values
        function changeSkinColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--skin-color', hexColor);
            triggerHappyAnimation();
        }

        function changeHairColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--hair-color', hexColor);
            triggerHappyAnimation();
        }

        function changeEyeColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--eye-color', hexColor);
            triggerHappyAnimation();
        }

        function changeAccessoryColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--accessory-color', hexColor);
            triggerHappyAnimation();
        }

        // Individual accessory color functions
        function changeGlassesColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--glasses-color', hexColor);
            triggerHappyAnimation();
        }

        function changeEarringsColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--earrings-color', hexColor);
            triggerHappyAnimation();
        }

        function changeCatColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--cat-color', hexColor);
            triggerHappyAnimation();
        }

        function changeDogColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--dog-color', hexColor);
            triggerHappyAnimation();
        }

        // Clothing color functions
        function changeTopColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--top-color', hexColor);
            triggerHappyAnimation();
        }

        function changeBottomColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--bottom-color', hexColor);
            triggerHappyAnimation();
        }

        function changeShoeColorHex(hexColor) {
            const root = document.documentElement;
            root.style.setProperty('--shoe-color', hexColor);
            triggerHappyAnimation();
        }

        // Clothing style functions
        function changeTopStyle(styleName) {
            // Hide all top styles
            document.querySelectorAll('.top-style').forEach(style => {
                style.classList.remove('active');
            });

            // Show selected top style
            const selectedStyle = document.getElementById(\`top-\${styleName}\`);
            if (selectedStyle) {
                selectedStyle.classList.add('active');
            }

            triggerHappyAnimation();
        }

        function changeBottomStyle(styleName) {
            // Hide all bottom styles
            document.querySelectorAll('.bottom-style').forEach(style => {
                style.classList.remove('active');
            });

            // Show selected bottom style
            const selectedStyle = document.getElementById(\`bottom-\${styleName}\`);
            if (selectedStyle) {
                selectedStyle.classList.add('active');
            }

            triggerHappyAnimation();
        }

        function changeShoeStyle(styleName) {
            // Hide all shoe styles
            document.querySelectorAll('.shoe-style').forEach(style => {
                style.classList.remove('active');
            });

            // Show selected shoe style
            const selectedStyle = document.getElementById(\`shoe-\${styleName}\`);
            if (selectedStyle) {
                selectedStyle.classList.add('active');
            }

            triggerHappyAnimation();
        }

        function toggleAccessory(accessoryName) {
            // Special handling for glasses with academic expression
            if (accessoryName === 'glasses') {
                const currentTheme = document.querySelector('.style-btn[data-style].active');
                if (currentTheme && currentTheme.dataset.style === 'academic') {
                    // Don't allow glasses accessory with academic expression (which has built-in glasses)
                    return;
                }
            }

            // Toggle selected accessory (allows multiple accessories)
            const selectedAccessory = document.getElementById(\`accessory-\${accessoryName}\`);
            const colorPickerContainer = document.getElementById(\`\${accessoryName}-color-picker\`);

            if (selectedAccessory) {
                if (selectedAccessory.classList.contains('active')) {
                    selectedAccessory.classList.remove('active');
                    // Hide color picker
                    if (colorPickerContainer) {
                        colorPickerContainer.style.display = 'none';
                    }
                } else {
                    selectedAccessory.classList.add('active');
                    // Show color picker
                    if (colorPickerContainer) {
                        colorPickerContainer.style.display = 'block';
                    }
                }
            }

            triggerHappyAnimation();
        }

        // Legacy function for initialization
        function changeAccessory(accessoryName) {
            // Hide all accessories
            document.querySelectorAll('.accessory').forEach(accessory => {
                accessory.classList.remove('active');
            });

            // Show selected accessory
            const selectedAccessory = document.getElementById(\`accessory-\${accessoryName}\`);
            if (selectedAccessory) {
                selectedAccessory.classList.add('active');
            }

            triggerHappyAnimation();
        }

        function changeExpression(expressionName) {
            // Hide all expressions
            document.querySelectorAll('.expression').forEach(expression => {
                expression.classList.remove('active');
            });

            // Show selected expression
            const selectedExpression = document.getElementById(\`mouth-\${expressionName}\`);
            if (selectedExpression) {
                selectedExpression.classList.add('active');
            }

            triggerHappyAnimation();
        }

        function triggerHappyAnimation() {
            const cyborgBody = document.querySelector('.cyborg-body');
            if (cyborgBody) {
                cyborgBody.style.animation = 'none';
                setTimeout(() => {
                    cyborgBody.style.animation = 'cyborgFloat 3s ease-in-out infinite';
                }, 10);
            }
        }

        // Initialize with cyberpunk theme, color picker defaults, modern hair style
        changeCharacterStyle('cyberpunk');

        // Set initial colors to match color picker defaults
        changeSkinColorHex('#C0C0C0');  // Silver/gray default
        changeHairStyle('4'); // Clean Cut style
        changeHairColorHex('#8B4513');  // Brown hair default
        changeEyeColorHex('#ec4899');   // Pink eyes as requested
        changeAccessoryColorHex('#E74C3C');  // Red accessory default

        // Initialize individual accessory colors to match color picker defaults
        changeGlassesColorHex('#E74C3C');    // Red glasses
        changeEarringsColorHex('#FFD700');   // Gold earrings
        changeCatColorHex('#FF8C42');        // Orange cat
        changeDogColorHex('#8B4513');        // Brown dog

        // Function to update friendship tooltip based on percentage
        function updateFriendshipTooltip() {
            const friendshipTooltip = document.getElementById('friendshipTooltip');
            const friendshipLabel = document.querySelector('.friendship-label');

            if (!friendshipTooltip || !friendshipLabel) return;

            // Extract percentage from label text (e.g., "💖 Friendship 75%" -> 75)
            const labelText = friendshipLabel.textContent;
            console.log('Label text:', labelText); // Debug log
            const percentageMatch = labelText.match(/(\d+)%/);
            const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
            console.log('Extracted percentage:', percentage); // Debug log

            let statusMessage = '';

            if (percentage >= 90) {
                statusMessage = 'Inseparable Buddies! 🌟💎';
            } else if (percentage >= 80) {
                statusMessage = 'Best Friends Forever! 🌟';
            } else if (percentage >= 60) {
                statusMessage = 'Close Friends! 💫';
            } else if (percentage >= 40) {
                statusMessage = 'Good Friends! 😊';
            } else if (percentage >= 20) {
                statusMessage = 'Getting Along Well! 👍';
            } else if (percentage >= 10) {
                statusMessage = 'Building Friendship! 🤝';
            } else {
                statusMessage = 'Just Getting Started! 👋';
            }

            friendshipTooltip.textContent = statusMessage;

            // Update the progress bar width to match the percentage
            const progressBar = document.querySelector('.friendship-progress');
            if (progressBar) {
                progressBar.style.width = percentage + '%';
            }
        }

        // Initialize clothing colors to match color picker defaults
        changeTopColorHex('#3498DB');    // Blue tank top
        changeBottomColorHex('#2C3E50'); // Dark blue pants
        changeShoeColorHex('#1A1A1A');   // Black dress shoes

        changeAccessory('none');
        changeExpression('neutral');

        // Initialize friendship tooltip
        updateFriendshipTooltip();

        // Initialize navigation
        showPanel(0);

        // Add initial welcome message
        addMessage('Hey there! I\\'m your coding buddy! 🤖\\nReady to tackle some code together?', 'buddy');

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            messageInput.value = '';

            vscode.postMessage({
                command: 'sendMessage',
                text: message
            });
        }

        function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}-message\`;

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            bubbleDiv.textContent = text;

            messageDiv.appendChild(bubbleDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'receiveMessage':
                    addMessage(message.message, 'buddy');
                    break;
                case 'loadConversation':
                    // Clear existing messages first to avoid duplicates
                    messagesContainer.innerHTML = '';

                    // Load conversation messages in order
                    message.messages.forEach(msg => {
                        const messageType = msg.type === 'user' ? 'user' : 'buddy';
                        addMessage(msg.text, messageType);
                    });
                    break;
                case 'loadPromptsAsMessages':
                    // Legacy support - still handle the old format
                    message.prompts.forEach(prompt => {
                        addMessage(prompt.text, 'user');
                    });
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    private _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

export function deactivate() {}