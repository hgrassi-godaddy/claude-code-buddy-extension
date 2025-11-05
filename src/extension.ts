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
            width: 80px;
            height: 80px;
            background: var(--vscode-background);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px auto;
            font-size: 48px;
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
            <div class="buddy-avatar">🤖</div>
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