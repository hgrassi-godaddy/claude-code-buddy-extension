// Claude Buddy - Bundled JavaScript for VS Code Webview
(function() {
    'use strict';

    const vscode = acquireVsCodeApi();

    // Constants
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

    // DOM elements
    let messagesContainer;
    let messageInput;
    let sendButton;

    // Utility functions
    function triggerHappyAnimation() {
        const cyborgBody = document.querySelector('.cyborg-body');
        if (cyborgBody) {
            cyborgBody.style.animation = 'none';
            setTimeout(() => {
                cyborgBody.style.animation = 'cyborgFloat 3s ease-in-out infinite';
            }, 10);
        }
    }

    function setRootProperty(property, value) {
        const root = document.documentElement;
        root.style.setProperty(property, value);
    }

    function hideAllElements(selector) {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.remove('active');
        });
    }

    function showElement(selector) {
        const element = document.getElementById(selector);
        if (element) {
            element.classList.add('active');
        }
        return element;
    }

    function updateActiveButton(selector, activeElement) {
        document.querySelectorAll(selector).forEach(btn => btn.classList.remove('active'));
        if (activeElement) {
            activeElement.classList.add('active');
        }
    }

    // Navigation functions
    function showPanel(index) {
        // Hide all panels
        customizationPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) panel.classList.remove('active');
        });

        // Show current panel
        const currentPanel = document.getElementById(customizationPanels[index]);
        if (currentPanel) currentPanel.classList.add('active');

        const navTitle = document.getElementById('navTitle');
        if (navTitle) {
            navTitle.textContent = panelTitles[index];
        }

        // Update arrow states
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === customizationPanels.length - 1;
    }

    // Customization functions
    function changeCharacterStyle(styleName) {
        const theme = styleThemes[styleName];
        if (!theme) return;

        setRootProperty('--jacket-color', theme.jacket);
        setRootProperty('--hair-color', theme.hair);
        setRootProperty('--eye-color', theme.eye);
        setRootProperty('--cyber-color', theme.cyber);
        setRootProperty('--pants-color', theme.pants);
        setRootProperty('--outline-color', theme.outline || '#2C3E50');

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
        if (!color) return;

        setRootProperty('--skin-color', color);
        triggerHappyAnimation();
    }

    function changeHairColor(colorName) {
        const color = hairColors[colorName];
        if (!color) return;

        setRootProperty('--hair-color', color);
        triggerHappyAnimation();
    }

    function changeHairStyle(styleNumber) {
        hideAllElements('.hair-style');
        showElement(`hair-style-${styleNumber}`);
        triggerHappyAnimation();
    }

    function changeEyeColor(colorName) {
        const color = eyeColors[colorName];
        if (!color) return;

        setRootProperty('--eye-color', color);
        triggerHappyAnimation();
    }

    // Color picker functions for hex values
    function changeSkinColorHex(hexColor) {
        setRootProperty('--skin-color', hexColor);
        triggerHappyAnimation();
    }

    function changeHairColorHex(hexColor) {
        setRootProperty('--hair-color', hexColor);
        triggerHappyAnimation();
    }

    function changeEyeColorHex(hexColor) {
        setRootProperty('--eye-color', hexColor);
        triggerHappyAnimation();
    }

    function changeAccessoryColorHex(hexColor) {
        setRootProperty('--accessory-color', hexColor);
        triggerHappyAnimation();
    }

    // Individual accessory color functions
    function changeGlassesColorHex(hexColor) {
        setRootProperty('--glasses-color', hexColor);
        triggerHappyAnimation();
    }

    function changeEarringsColorHex(hexColor) {
        setRootProperty('--earrings-color', hexColor);
        triggerHappyAnimation();
    }

    function changeCatColorHex(hexColor) {
        setRootProperty('--cat-color', hexColor);
        triggerHappyAnimation();
    }

    function changeDogColorHex(hexColor) {
        setRootProperty('--dog-color', hexColor);
        triggerHappyAnimation();
    }

    // Clothing color functions
    function changeTopColorHex(hexColor) {
        setRootProperty('--top-color', hexColor);
        triggerHappyAnimation();
    }

    function changeBottomColorHex(hexColor) {
        setRootProperty('--bottom-color', hexColor);
        triggerHappyAnimation();
    }

    function changeShoeColorHex(hexColor) {
        setRootProperty('--shoe-color', hexColor);
        triggerHappyAnimation();
    }

    // Clothing style functions
    function changeTopStyle(styleName) {
        hideAllElements('.top-style');
        showElement(`top-${styleName}`);
        triggerHappyAnimation();
    }

    function changeBottomStyle(styleName) {
        hideAllElements('.bottom-style');
        showElement(`bottom-${styleName}`);
        triggerHappyAnimation();
    }

    function changeShoeStyle(styleName) {
        hideAllElements('.shoe-style');
        showElement(`shoe-${styleName}`);
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
        const selectedAccessory = document.getElementById(`accessory-${accessoryName}`);
        const colorPickerContainer = document.getElementById(`${accessoryName}-color-picker`);

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
        hideAllElements('.accessory');

        if (accessoryName !== 'none') {
            showElement(`accessory-${accessoryName}`);
        }

        triggerHappyAnimation();
    }

    function changeExpression(expressionName) {
        hideAllElements('.expression');
        showElement(`mouth-${expressionName}`);
        triggerHappyAnimation();
    }

    // Messaging functions
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

    function addMessage(text, type) {
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

    // Friendship functions
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

    // Event setup functions
    function setupCustomizationListeners() {
        // Style theme buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.style;
                if (style && styleThemes[style]) {
                    changeCharacterStyle(style);
                    updateActiveButton('.style-btn', e.target);
                }
            });
        });

        // Skin color buttons
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (color && skinColors[color]) {
                    changeSkinColor(color);
                    updateActiveButton('#skinPanel .color-btn', e.target);
                }
            });
        });

        // Hair style buttons
        document.querySelectorAll('[data-hair-style]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.hairStyle;
                if (style) {
                    changeHairStyle(style);
                    updateActiveButton('[data-hair-style]', e.target);
                }
            });
        });

        // Hair color buttons
        document.querySelectorAll('[data-hair]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.hair;
                if (color && hairColors[color]) {
                    changeHairColor(color);
                    updateActiveButton('#hairPanel .color-btn', e.target);
                }
            });
        });

        // Eye color buttons
        document.querySelectorAll('[data-eye]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.eye;
                if (color && eyeColors[color]) {
                    changeEyeColor(color);
                    updateActiveButton('#eyePanel .color-btn', e.target);
                }
            });
        });

        // Accessory buttons
        document.querySelectorAll('[data-accessory]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accessory = e.target.dataset.accessory;
                if (accessory) {
                    toggleAccessory(accessory);
                    e.target.classList.toggle('active');
                }
            });
        });

        // Expression buttons
        document.querySelectorAll('[data-expression]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const expression = e.target.dataset.expression;
                if (expression) {
                    changeExpression(expression);
                    updateActiveButton('[data-expression]', e.target);
                }
            });
        });

        // Top style buttons
        document.querySelectorAll('[data-top]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const top = e.target.dataset.top;
                if (top) {
                    changeTopStyle(top);
                    updateActiveButton('[data-top]', e.target);
                }
            });
        });

        // Bottom style buttons
        document.querySelectorAll('[data-bottom]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bottom = e.target.dataset.bottom;
                if (bottom) {
                    changeBottomStyle(bottom);
                    updateActiveButton('[data-bottom]', e.target);
                }
            });
        });

        // Shoe style buttons
        document.querySelectorAll('[data-shoe]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shoe = e.target.dataset.shoe;
                if (shoe) {
                    changeShoeStyle(shoe);
                    updateActiveButton('[data-shoe]', e.target);
                }
            });
        });

        setupColorPickers();
    }

    function setupColorPickers() {
        const colorPickerMappings = [
            { id: 'skinColorPicker', handler: changeSkinColorHex },
            { id: 'hairColorPicker', handler: changeHairColorHex },
            { id: 'eyeColorPicker', handler: changeEyeColorHex },
            { id: 'accessoryColorPicker', handler: changeAccessoryColorHex },
            { id: 'glassesColorPicker', handler: changeGlassesColorHex },
            { id: 'earringsColorPicker', handler: changeEarringsColorHex },
            { id: 'catColorPicker', handler: changeCatColorHex },
            { id: 'dogColorPicker', handler: changeDogColorHex },
            { id: 'topColorPicker', handler: changeTopColorHex },
            { id: 'bottomColorPicker', handler: changeBottomColorHex },
            { id: 'shoeColorPicker', handler: changeShoeColorHex }
        ];

        colorPickerMappings.forEach(({ id, handler }) => {
            const picker = document.getElementById(id);
            if (picker) {
                picker.addEventListener('change', (e) => {
                    handler(e.target.value);
                });
            }
        });
    }

    function setupNavigationListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPanelIndex > 0) {
                    currentPanelIndex--;
                    showPanel(currentPanelIndex);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPanelIndex < customizationPanels.length - 1) {
                    currentPanelIndex++;
                    showPanel(currentPanelIndex);
                }
            });
        }
    }

    function setupMessagingListeners() {
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

    // Initialize default customization
    function initializeCustomization() {
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

        // Initialize clothing colors to match color picker defaults
        changeTopColorHex('#3498DB');    // Blue tank top
        changeBottomColorHex('#2C3E50'); // Dark blue pants
        changeShoeColorHex('#1A1A1A');   // Black dress shoes

        changeAccessory('none');
        changeExpression('neutral');
    }

    // Main initialization function
    function initialize() {
        // Get DOM elements
        messagesContainer = document.getElementById('messages');
        messageInput = document.getElementById('messageInput');
        sendButton = document.getElementById('sendButton');

        // Initialize all modules
        initializeCustomization();

        // Setup event listeners
        setupNavigationListeners();
        setupMessagingListeners();
        setupCustomizationListeners();
        setupLetscodeButton();

        // Initialize UI state
        updateFriendshipTooltip();
        showPanel(0); // Start with first panel

        // Add initial welcome message
        addMessage('Hey there! I\'m your coding buddy! 🤖\\nReady to tackle some code together?', 'buddy');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();