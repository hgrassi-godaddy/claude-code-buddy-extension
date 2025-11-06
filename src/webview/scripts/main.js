// Main initialization and orchestration
import { setupNavigationListeners, showPanel } from './navigation.js';
import { initializeMessaging, setupMessagingListeners } from './messaging.js';
import { updateFriendshipTooltip } from './friendship.js';
import { setupCustomizationListeners, initializeCustomization } from './customization.js';

// Main initialization function
function initialize() {
    // Get VS Code API
    const vscode = acquireVsCodeApi();

    // Initialize all modules
    initializeMessaging(vscode);
    initializeCustomization();

    // Setup event listeners
    setupNavigationListeners();
    setupMessagingListeners();
    setupCustomizationListeners();
    setupLetscodeButton();

    // Initialize UI state
    updateFriendshipTooltip();
    showPanel(0); // Start with first panel
}

function setupLetscodeButton() {
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}