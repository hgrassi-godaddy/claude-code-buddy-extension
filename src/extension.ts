import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Buddy extension is now active!');

    // Create the webview provider
    const provider = new ClaudeBuddyViewProvider(context.extensionUri);

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('claudeBuddyPanel', provider)
    );

    // Register command to open panel
    const disposable = vscode.commands.registerCommand('claude-buddy.openPanel', () => {
        vscode.window.showInformationMessage('Claude Buddy Panel Opening!');
    });

    context.subscriptions.push(disposable);
}

class ClaudeBuddyViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

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

        /* Buddy Section - Large */
        .buddy-section {
            flex: 0 0 200px;
            text-align: center;
            padding: 20px;
            border: 2px dashed var(--vscode-input-border);
            border-radius: 12px;
            margin-bottom: 16px;
            background: var(--vscode-input-background);
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .buddy-avatar {
            width: 120px;
            height: 140px;
            margin: 0 auto 12px auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Cyborg Animations */
        .cyborg-container {
            position: relative;
            width: 120px;
            height: 140px;
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

        .cyber-glow {
            animation: cyberPulse 2s ease-in-out infinite;
        }

        .cyberpunk-mode .cyber-glow {
            filter: drop-shadow(0 0 6px var(--cyber-color)) drop-shadow(0 0 12px var(--cyber-color));
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

        /* Color Controls */
        .color-controls {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin: 4px 0;
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

        /* Friendship Level - Compact */
        .friendship-section {
            flex: 0 0 auto;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            margin-top: 12px;
        }

        .friendship-header {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 4px;
        }

        .friendship-bar {
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 4px;
        }

        .friendship-progress {
            height: 100%;
            background: linear-gradient(90deg, #ec4899, #dc2626, #ec4899);
            width: 75%;
            transition: width 0.5s ease;
        }

        .friendship-text {
            text-align: center;
            font-size: 11px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Large Buddy Section -->
        <div class="buddy-section">
            <div class="buddy-avatar">
                <div class="cyborg-container">
                    <svg width="120" height="140" viewBox="0 0 120 140" class="cyborg-body">
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

                        <!-- Body Shadow -->
                        <ellipse cx="62" cy="102" rx="24" ry="34" fill="url(#skinGradient)" opacity="0.3"/>

                        <!-- Base Body -->
                        <ellipse cx="60" cy="100" rx="24" ry="33" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>

                        <!-- Torso/Jacket -->
                        <g id="jacket-layer">
                            <path d="M37 84 Q37 76 46 76 L74 76 Q83 76 83 84 L83 118 Q83 122 79 122 L41 122 Q37 122 37 118 Z"
                                  fill="url(#jacketGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>
                            <!-- Jacket Details -->
                            <circle cx="45" cy="86" r="1.5" fill="var(--outline-color, #2C3E50)" opacity="0.6"/>
                            <circle cx="75" cy="86" r="1.5" fill="var(--outline-color, #2C3E50)" opacity="0.6"/>
                            <rect x="58" y="78" width="4" height="12" rx="2" fill="var(--outline-color, #2C3E50)" opacity="0.4"/>
                        </g>

                        <!-- Head Shadow -->
                        <ellipse cx="61" cy="46" rx="21" ry="24" fill="url(#skinGradient)" opacity="0.3"/>

                        <!-- Head -->
                        <g class="cyborg-head">
                            <ellipse cx="60" cy="45" rx="20" ry="23" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="1"/>

                            <!-- Hair -->
                            <g class="cyborg-hair" id="hair-layer">
                                <path d="M40 32 Q48 18 60 20 Q72 18 80 32 Q82 36 80 40 L78 38 Q76 26 60 26 Q44 26 42 38 L40 40 Q38 36 40 32 Z"
                                      fill="url(#hairGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                                <!-- Hair highlights -->
                                <path d="M50 25 Q56 22 62 25 Q68 22 72 28" fill="none" stroke="var(--hair-color, #2C3E50)" stroke-width="0.5" opacity="0.5"/>
                            </g>

                            <!-- Eyes -->
                            <g class="cyborg-eyes">
                                <ellipse cx="52" cy="42" rx="3.5" ry="5" fill="white"/>
                                <ellipse cx="68" cy="42" rx="3.5" ry="5" fill="white"/>
                                <circle cx="52" cy="42.5" r="2.2" fill="var(--eye-color, #3498DB)"/>
                                <circle cx="68" cy="42.5" r="2.2" fill="var(--eye-color, #3498DB)"/>
                                <circle cx="52.5" cy="41.5" r="0.8" fill="white"/>
                                <circle cx="68.5" cy="41.5" r="0.8" fill="white"/>
                                <!-- Eyelids -->
                                <path d="M48.5 39 Q52 38 55.5 39" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                                <path d="M64.5 39 Q68 38 71.5 39" fill="none" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                            </g>

                            <!-- Nose -->
                            <ellipse cx="60" cy="47" rx="1" ry="2" fill="var(--outline-color, #2C3E50)" opacity="0.3"/>

                            <!-- Cybernetic Implants -->
                            <g id="cyber-layer">
                                <rect x="73" y="39" width="5" height="6" rx="1.5" fill="var(--cyber-color, #E74C3C)" class="cyber-glow"/>
                                <line x1="75" y1="37" x2="75" y2="39" stroke="var(--cyber-color, #E74C3C)" stroke-width="0.8"/>
                                <circle cx="75.5" cy="36" r="0.8" fill="var(--cyber-color, #E74C3C)" class="cyber-glow"/>
                                <!-- Additional tech details -->
                                <rect x="74" y="40.5" width="3" height="1" fill="var(--cyber-color, #E74C3C)" opacity="0.7"/>
                                <rect x="74" y="42" width="3" height="1" fill="var(--cyber-color, #E74C3C)" opacity="0.7"/>
                            </g>

                            <!-- Glasses Layer (Hidden by default) -->
                            <g id="glasses-layer" style="display: none;">
                                <ellipse cx="52" cy="42" rx="6" ry="4" fill="none" stroke="var(--glasses-color, #2C3E50)" stroke-width="1.5"/>
                                <ellipse cx="68" cy="42" rx="6" ry="4" fill="none" stroke="var(--glasses-color, #2C3E50)" stroke-width="1.5"/>
                                <line x1="58" y1="42" x2="62" y2="42" stroke="var(--glasses-color, #2C3E50)" stroke-width="1.5"/>
                                <!-- Nose bridge -->
                                <line x1="46" y1="40" x2="42" y2="38" stroke="var(--glasses-color, #2C3E50)" stroke-width="1"/>
                                <line x1="74" y1="40" x2="78" y2="38" stroke="var(--glasses-color, #2C3E50)" stroke-width="1"/>
                            </g>

                            <!-- Mouth -->
                            <ellipse cx="60" cy="51" rx="2.5" ry="1.5" fill="var(--mouth-color, #D2691E)" opacity="0.8"/>
                        </g>

                        <!-- Arms with gradients -->
                        <ellipse cx="37" cy="95" rx="7" ry="18" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>
                        <ellipse cx="83" cy="95" rx="7" ry="18" fill="url(#skinGradient)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.8"/>

                        <!-- Legs with better shape -->
                        <ellipse cx="52" cy="130" rx="7" ry="10" fill="var(--pants-color, #2C3E50)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                        <ellipse cx="68" cy="130" rx="7" ry="10" fill="var(--pants-color, #2C3E50)" stroke="var(--outline-color, #2C3E50)" stroke-width="0.5"/>
                    </svg>
                </div>
            </div>

            <!-- Style Controls -->
            <div class="style-controls">
                <div class="style-btn active" data-style="cyberpunk">🌃 Cyber</div>
                <div class="style-btn" data-style="academic">🎓 Academic</div>
                <div class="style-btn" data-style="casual">👕 Casual</div>
            </div>

            <!-- Color Controls -->
            <div class="color-controls" style="gap: 3px; flex-wrap: wrap; max-width: 100px; margin: 4px auto;">
                <div class="color-btn active" data-color="fair" style="background: #FDBCB4" title="Fair"></div>
                <div class="color-btn" data-color="light" style="background: #F4C2A1" title="Light"></div>
                <div class="color-btn" data-color="medium" style="background: #D4A574" title="Medium"></div>
                <div class="color-btn" data-color="olive" style="background: #C19A6B" title="Olive"></div>
                <div class="color-btn" data-color="dark" style="background: #8B4513" title="Dark"></div>
                <div class="color-btn" data-color="deep" style="background: #654321" title="Deep"></div>
                <div class="color-btn" data-color="silver" style="background: linear-gradient(145deg, #C0C0C0, #A8A8A8)" title="Silver"></div>
                <div class="color-btn" data-color="purple" style="background: #8A2BE2" title="Purple"></div>
            </div>

            <div class="buddy-title">Claude Buddy</div>
            <div class="buddy-status">Ready to help!</div>
        </div>

        <!-- Chat Section -->
        <div class="chat-section">
            <div id="messages" class="messages"></div>
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Message Buddy..." maxlength="500">
                <button id="sendButton">Send</button>
            </div>
        </div>

        <!-- Compact Friendship Section -->
        <div class="friendship-section">
            <div class="friendship-header">
                <span>💖 Friendship</span>
                <span>75%</span>
            </div>
            <div class="friendship-bar">
                <div class="friendship-progress"></div>
            </div>
            <div class="friendship-text">Great friends! 😊</div>
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
                hair: '#00FFFF',
                eye: '#FF00FF',
                cyber: '#00FF41',
                glasses: false,
                pants: '#1A0033',
                jacketGlow: true,
                outline: '#00FFFF'
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

        // Set up skin color changing
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (color && skinColors[color]) {
                    changeSkinColor(color);

                    // Update active button
                    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        function changeCharacterStyle(styleName) {
            const theme = styleThemes[styleName];
            const root = document.documentElement;

            root.style.setProperty('--jacket-color', theme.jacket);
            root.style.setProperty('--hair-color', theme.hair);
            root.style.setProperty('--eye-color', theme.eye);
            root.style.setProperty('--cyber-color', theme.cyber);
            root.style.setProperty('--pants-color', theme.pants);
            root.style.setProperty('--outline-color', theme.outline || '#2C3E50');

            // Show/hide glasses
            const glasses = document.getElementById('glasses-layer');
            if (glasses) {
                glasses.style.display = theme.glasses ? 'block' : 'none';
            }

            // Apply cyberpunk glow effects
            const jacket = document.getElementById('jacket-layer');
            const cyborgBody = document.querySelector('.cyborg-body');

            if (theme.jacketGlow && styleName === 'cyberpunk') {
                if (jacket) jacket.style.filter = 'drop-shadow(0 0 8px ' + theme.cyber + ')';
                if (cyborgBody) cyborgBody.classList.add('cyberpunk-mode');
            } else {
                if (jacket) jacket.style.filter = 'none';
                if (cyborgBody) cyborgBody.classList.remove('cyberpunk-mode');
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

        function triggerHappyAnimation() {
            const cyborgBody = document.querySelector('.cyborg-body');
            if (cyborgBody) {
                cyborgBody.style.animation = 'none';
                setTimeout(() => {
                    cyborgBody.style.animation = 'cyborgFloat 3s ease-in-out infinite';
                }, 10);
            }
        }

        // Initialize with cyberpunk theme and fair skin
        changeCharacterStyle('cyberpunk');
        changeSkinColor('fair');

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