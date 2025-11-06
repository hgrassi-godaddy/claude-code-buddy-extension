// Chat messaging functionality

let messagesContainer;
let messageInput;
let sendButton;
let vscode;

export function initializeMessaging(vsCodeApi) {
    vscode = vsCodeApi;
    messagesContainer = document.getElementById('messages');
    messageInput = document.getElementById('messageInput');
    sendButton = document.getElementById('sendButton');

    // Add initial welcome message
    addMessage('Hey there! I\'m your coding buddy! 🤖\\nReady to tackle some code together?', 'buddy');
}

export function setupMessagingListeners() {
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Listen for messages from the extension
    window.addEventListener('message', handleExtensionMessage);
}

function sendMessage() {
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    messageInput.value = '';

    if (vscode) {
        vscode.postMessage({
            command: 'sendMessage',
            text: message
        });
    }
}

export function addMessage(text, type) {
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;

    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleExtensionMessage(event) {
    const message = event.data;
    switch (message.command) {
        case 'receiveMessage':
            addMessage(message.message, 'buddy');
            break;
        case 'loadConversation':
            // Clear existing messages first to avoid duplicates
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }

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
}