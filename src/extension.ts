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
            width: 100px;
            height: 120px;
            margin: 0 auto 12px auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Robot Animations */
        .robot-container {
            position: relative;
            width: 100px;
            height: 120px;
        }

        .robot-body {
            animation: robotFloat 3s ease-in-out infinite;
        }

        .robot-head {
            animation: robotBob 2s ease-in-out infinite;
        }

        .robot-eyes {
            animation: robotBlink 4s ease-in-out infinite;
        }

        .robot-antenna {
            animation: robotAntenna 2.5s ease-in-out infinite;
        }

        @keyframes robotFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
        }

        @keyframes robotBob {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(1deg); }
            75% { transform: rotate(-1deg); }
        }

        @keyframes robotBlink {
            0%, 90%, 100% { opacity: 1; }
            95% { opacity: 0.3; }
        }

        @keyframes robotAntenna {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
        }

        /* Color Controls */
        .color-controls {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin: 8px 0;
        }

        .color-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid var(--vscode-input-border);
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .color-btn:hover {
            transform: scale(1.1);
        }

        .color-btn.active {
            border-color: var(--vscode-button-background);
            box-shadow: 0 0 8px rgba(14, 99, 156, 0.5);
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
                <div class="robot-container">
                    <svg width="100" height="120" viewBox="0 0 100 120" class="robot-body">
                        <!-- Robot Body -->
                        <rect x="25" y="60" width="50" height="45" rx="8" class="robot-main-body" fill="var(--robot-primary, #4A90E2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="2"/>

                        <!-- Robot Head -->
                        <g class="robot-head">
                            <rect x="30" y="20" width="40" height="35" rx="12" class="robot-head-body" fill="var(--robot-primary, #4A90E2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="2"/>

                            <!-- Eyes -->
                            <g class="robot-eyes">
                                <circle cx="38" cy="35" r="4" fill="var(--robot-accent, #E74C3C)"/>
                                <circle cx="62" cy="35" r="4" fill="var(--robot-accent, #E74C3C)"/>
                            </g>

                            <!-- Mouth -->
                            <rect x="45" y="43" width="10" height="3" rx="1.5" fill="var(--robot-outline, #2C3E50)"/>
                        </g>

                        <!-- Antenna -->
                        <g class="robot-antenna">
                            <line x1="50" y1="20" x2="50" y2="10" stroke="var(--robot-outline, #2C3E50)" stroke-width="2"/>
                            <circle cx="50" cy="8" r="3" fill="var(--robot-accent, #E74C3C)"/>
                        </g>

                        <!-- Arms -->
                        <rect x="15" y="65" width="8" height="25" rx="4" fill="var(--robot-secondary, #5DADE2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="1"/>
                        <rect x="77" y="65" width="8" height="25" rx="4" fill="var(--robot-secondary, #5DADE2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="1"/>

                        <!-- Legs -->
                        <rect x="32" y="105" width="10" height="12" rx="5" fill="var(--robot-secondary, #5DADE2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="1"/>
                        <rect x="58" y="105" width="10" height="12" rx="5" fill="var(--robot-secondary, #5DADE2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="1"/>

                        <!-- Body Details -->
                        <circle cx="45" cy="75" r="3" fill="var(--robot-accent, #E74C3C)"/>
                        <circle cx="55" cy="75" r="3" fill="var(--robot-accent, #E74C3C)"/>
                        <rect x="40" y="85" width="20" height="8" rx="2" fill="var(--robot-secondary, #5DADE2)" stroke="var(--robot-outline, #2C3E50)" stroke-width="1"/>
                    </svg>
                </div>
            </div>

            <!-- Color Controls -->
            <div class="color-controls">
                <div class="color-btn active" data-color="blue" style="background: linear-gradient(135deg, #4A90E2, #5DADE2)" title="Blue"></div>
                <div class="color-btn" data-color="green" style="background: linear-gradient(135deg, #52C41A, #73D13D)" title="Green"></div>
                <div class="color-btn" data-color="purple" style="background: linear-gradient(135deg, #722ED1, #9254DE)" title="Purple"></div>
                <div class="color-btn" data-color="orange" style="background: linear-gradient(135deg, #FA8C16, #FFA940)" title="Orange"></div>
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

        // Color themes for robot customization
        const colorThemes = {
            blue: {
                primary: '#4A90E2',
                secondary: '#5DADE2',
                accent: '#E74C3C',
                outline: '#2C3E50'
            },
            green: {
                primary: '#52C41A',
                secondary: '#73D13D',
                accent: '#FA8C16',
                outline: '#2C3E50'
            },
            purple: {
                primary: '#722ED1',
                secondary: '#9254DE',
                accent: '#FA541C',
                outline: '#2C3E50'
            },
            orange: {
                primary: '#FA8C16',
                secondary: '#FFA940',
                accent: '#52C41A',
                outline: '#2C3E50'
            }
        };

        // Set up color changing functionality
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (color && colorThemes[color]) {
                    changeRobotColor(color);

                    // Update active button
                    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        function changeRobotColor(colorName) {
            const theme = colorThemes[colorName];
            const root = document.documentElement;

            root.style.setProperty('--robot-primary', theme.primary);
            root.style.setProperty('--robot-secondary', theme.secondary);
            root.style.setProperty('--robot-accent', theme.accent);
            root.style.setProperty('--robot-outline', theme.outline);

            // Trigger a happy animation when color changes
            const robotBody = document.querySelector('.robot-body');
            if (robotBody) {
                robotBody.style.animation = 'none';
                setTimeout(() => {
                    robotBody.style.animation = 'robotFloat 3s ease-in-out infinite';
                }, 10);
            }
        }

        // Initialize with blue theme
        changeRobotColor('blue');

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