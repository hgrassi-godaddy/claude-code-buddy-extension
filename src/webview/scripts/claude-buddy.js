// Claude Buddy - Bundled JavaScript for VS Code Webview
(function() {
    'use strict';

    console.log('[Webview] *** JAVASCRIPT FILE LOADED ***');

    const vscode = acquireVsCodeApi();
    console.log('[Webview] VSCode API acquired:', !!vscode);

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
    let successSoundButton;
    let failureSoundButton;
    let alertSoundButton;

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
    function changeCharacterStyle(styleName, skipSave = false) {
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
        
        if (!skipSave) saveAvatarConfig();
    }

    function changeSkinColor(colorName) {
        const color = skinColors[colorName];
        if (!color) return;

        setRootProperty('--skin-color', color);
        triggerHappyAnimation();
        saveAvatarConfig();
    }

    function changeHairColor(colorName) {
        const color = hairColors[colorName];
        if (!color) return;

        setRootProperty('--hair-color', color);
        triggerHappyAnimation();
        saveAvatarConfig();
    }

    function changeHairStyle(styleNumber, skipSave = false) {
        hideAllElements('.hair-style');
        showElement(`hair-style-${styleNumber}`);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeEyeColor(colorName) {
        const color = eyeColors[colorName];
        if (!color) return;

        setRootProperty('--eye-color', color);
        triggerHappyAnimation();
        saveAvatarConfig();
    }

    // Color picker functions for hex values
    function changeSkinColorHex(hexColor, skipSave = false) {
        setRootProperty('--skin-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeHairColorHex(hexColor, skipSave = false) {
        setRootProperty('--hair-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeEyeColorHex(hexColor, skipSave = false) {
        setRootProperty('--eye-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeAccessoryColorHex(hexColor, skipSave = false) {
        setRootProperty('--accessory-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    // Individual accessory color functions
    function changeGlassesColorHex(hexColor, skipSave = false) {
        setRootProperty('--glasses-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeEarringsColorHex(hexColor, skipSave = false) {
        setRootProperty('--earrings-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeCatColorHex(hexColor, skipSave = false) {
        setRootProperty('--cat-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeDogColorHex(hexColor, skipSave = false) {
        setRootProperty('--dog-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    // Clothing color functions
    function changeTopColorHex(hexColor, skipSave = false) {
        setRootProperty('--top-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeBottomColorHex(hexColor, skipSave = false) {
        setRootProperty('--bottom-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeShoeColorHex(hexColor, skipSave = false) {
        setRootProperty('--shoe-color', hexColor);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    // Clothing style functions
    function changeTopStyle(styleName, skipSave = false) {
        hideAllElements('.top-style');
        showElement(`top-${styleName}`);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeBottomStyle(styleName, skipSave = false) {
        hideAllElements('.bottom-style');
        showElement(`bottom-${styleName}`);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function changeShoeStyle(styleName, skipSave = false) {
        hideAllElements('.shoe-style');
        showElement(`shoe-${styleName}`);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    function toggleAccessory(accessoryName, skipSave = false) {
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
        if (!skipSave) saveAvatarConfig();
    }

    // Legacy function for initialization
    function changeAccessory(accessoryName) {
        hideAllElements('.accessory');

        if (accessoryName !== 'none') {
            showElement(`accessory-${accessoryName}`);
        }

        triggerHappyAnimation();
    }

    function changeExpression(expressionName, skipSave = false) {
        hideAllElements('.expression');
        showElement(`mouth-${expressionName}`);
        triggerHappyAnimation();
        if (!skipSave) saveAvatarConfig();
    }

    // Messaging functions
    function sendMessage() {
        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        messageInput.value = '';

        // Reset to original small size after sending
        messageInput.style.height = '34px';
        messageInput.style.overflowY = 'hidden';

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
    function updateFriendshipMetrics(friendshipData) {
        const friendshipLabel = document.querySelector('.friendship-label');
        const friendshipTooltip = document.getElementById('friendshipTooltip');
        const progressBar = document.querySelector('.friendship-progress');

        if (!friendshipData) return;

        const percentage = friendshipData.friendshipScore || 0;
        const totalInteractions = friendshipData.totalInteractions || 0;
        const positiveInteractions = friendshipData.positiveInteractions || 0;

        // Update friendship label
        if (friendshipLabel) {
            friendshipLabel.textContent = `🩵 Friendship ${percentage}%`;
        }

        // Update progress bar
        if (progressBar) {
            progressBar.style.width = percentage + '%';

            // Consistent light blue progress fill
            progressBar.style.background = 'linear-gradient(90deg, #87CEEB, #ADD8E6)'; // Consistent sky blue to light blue
        }

        // Update tooltip
        if (friendshipTooltip) {
            let statusMessage = '';
            let detailMessage = '';

            if (percentage >= 90) {
                statusMessage = 'Inseparable Buddies! 🌟💎';
                detailMessage = 'You two are the best of friends!';
            } else if (percentage >= 80) {
                statusMessage = 'Best Friends Forever! 🌟';
                detailMessage = 'Your friendship is really strong!';
            } else if (percentage >= 60) {
                statusMessage = 'Close Friends! 💫';
                detailMessage = 'You\'re getting along great!';
            } else if (percentage >= 40) {
                statusMessage = 'Good Friends! 😊';
                detailMessage = 'Building a solid friendship!';
            } else if (percentage >= 20) {
                statusMessage = 'Getting Along Well! 👍';
                detailMessage = 'Keep chatting to grow closer!';
            } else if (percentage >= 10) {
                statusMessage = 'Building Friendship! 🤝';
                detailMessage = 'Off to a good start!';
            } else {
                statusMessage = 'Just Getting Started! 👋';
                detailMessage = 'Chat more to build friendship!';
            }

            friendshipTooltip.innerHTML = `
                <div><strong>${statusMessage}</strong></div>
                <div style="font-size: 11px; margin-top: 4px;">${detailMessage}</div>
                <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">
                    💬 ${totalInteractions} chats • 😊 ${positiveInteractions} positive
                </div>
            `;
        }

        console.log('[Webview] Updated friendship metrics:', friendshipData);
    }

    function updateFriendshipTooltip() {
        // Legacy function - kept for compatibility
        // Now handled by updateFriendshipMetrics
        console.log('[Webview] updateFriendshipTooltip called (legacy)');
    }

    // Typing indicator functions
    let typingIndicatorElement = null;

    function handleTypingIndicator(isTyping) {
        if (!messagesContainer) return;

        if (isTyping) {
            // Show typing indicator
            if (!typingIndicatorElement) {
                typingIndicatorElement = document.createElement('div');
                typingIndicatorElement.className = 'message buddy-message typing-indicator';
                typingIndicatorElement.innerHTML = `
                    <div class="message-bubble typing-bubble">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                `;
                messagesContainer.appendChild(typingIndicatorElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } else {
            // Hide typing indicator
            if (typingIndicatorElement) {
                typingIndicatorElement.remove();
                typingIndicatorElement = null;
            }
        }
    }

    // Event setup functions
    function setupCustomizationListeners() {
        // Style theme buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.style;
                if (style && styleThemes[style]) {
                    updateActiveButton('.style-btn', e.target); // Update button FIRST
                    changeCharacterStyle(style); // Then apply style (which saves config)
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
                    updateActiveButton('[data-hair-style]', e.target);
                    changeHairStyle(style);
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
                    updateActiveButton('[data-expression]', e.target);
                    changeExpression(expression);
                }
            });
        });

        // Top style buttons
        document.querySelectorAll('[data-top]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const top = e.target.dataset.top;
                if (top) {
                    updateActiveButton('[data-top]', e.target);
                    changeTopStyle(top);
                }
            });
        });

        // Bottom style buttons
        document.querySelectorAll('[data-bottom]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bottom = e.target.dataset.bottom;
                if (bottom) {
                    updateActiveButton('[data-bottom]', e.target);
                    changeBottomStyle(bottom);
                }
            });
        });

        // Shoe style buttons
        document.querySelectorAll('[data-shoe]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shoe = e.target.dataset.shoe;
                if (shoe) {
                    updateActiveButton('[data-shoe]', e.target);
                    changeShoeStyle(shoe);
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

    // Sound functions - delegated to SoundService
    function playSuccessSound() {
        if (window.SoundService) {
            window.SoundService.playSuccessSound();
        } else {
            console.warn('[Webview] SoundService not available');
        }
    }

    function playFailureSound() {
        if (window.SoundService) {
            window.SoundService.playFailureSound();
        } else {
            console.warn('[Webview] SoundService not available');
        }
    }

    function playAlertSound() {
        if (window.SoundService) {
            window.SoundService.playAlertSound();
        } else {
            console.warn('[Webview] SoundService not available');
        }
    }

    function setupMessagingListeners() {
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }

        if (successSoundButton) {
            successSoundButton.addEventListener('click', () => {
                playSuccessSound();
                console.log('[Webview] Success sound button clicked');
            });
        }

        if (failureSoundButton) {
            failureSoundButton.addEventListener('click', () => {
                playFailureSound();
                console.log('[Webview] Failure sound button clicked');
            });
        }

        if (alertSoundButton) {
            alertSoundButton.addEventListener('click', () => {
                playAlertSound();
                console.log('[Webview] Alert sound button clicked');
            });
        }

        if (messageInput) {
            // Handle Enter key (send on Enter, new line on Shift+Enter when expanded)
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent new line
                    sendMessage();
                }
            });

            // Auto-resize based on character count
            messageInput.addEventListener('input', autoResizeTextarea);
        }

        // Listen for messages from the extension
        window.addEventListener('message', handleExtensionMessage);
    }

    // Auto-resize textarea function - only expand after 25 characters
    function autoResizeTextarea() {
        if (messageInput) {
            const textLength = messageInput.value.length;

            if (textLength >= 25) {
                // Expand to fit content and enable scrolling
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
                messageInput.style.overflowY = 'auto';
            } else {
                // Keep at original single-line size
                messageInput.style.height = '34px';
                messageInput.style.overflowY = 'hidden';
            }
        }
    }

    function handleExtensionMessage(event) {
        const message = event.data;
        console.log('[Webview] Received message:', message.command);
        switch (message.command) {
            case 'receiveMessage':
                addMessage(message.message, 'buddy');
                // Update friendship metrics if provided
                if (message.friendshipData) {
                    updateFriendshipMetrics(message.friendshipData);
                }
                break;
            case 'showTyping':
                handleTypingIndicator(message.isTyping);
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
            case 'loadAvatarConfig':
                // Load saved avatar configuration
                console.log('[Webview] loadAvatarConfig received, config:', message.config);
                loadAvatarConfig(message.config);
                break;
            case 'updateFriendship':
                // Update friendship display and modal
                console.log('[Webview] updateFriendship received:', message.data);
                updateFriendshipDisplay(message.data);
                break;
        }
    }

    // Friendship System Functions
    function updateFriendshipDisplay(data) {
        try {
            const { summary, displayString, message: friendshipMessage } = data;

            // Update main friendship bar display (now shows single percentage)
            const friendshipLabel = document.getElementById('friendshipLabel');
            if (friendshipLabel) {
                friendshipLabel.textContent = `💖 ${displayString}`; // e.g., "💖 Friendship 45%"
            }

            // Update friendship tooltip message
            const friendshipTooltip = document.getElementById('friendshipTooltip');
            if (friendshipTooltip) {
                friendshipTooltip.textContent = friendshipMessage;
            }

            // Update progress bar (use total percentage)
            const friendshipProgress = document.getElementById('friendshipProgress');
            if (friendshipProgress) {
                const totalPercentage = summary.averagePercentage || 0; // This is actually the total percentage now
                friendshipProgress.style.width = `${totalPercentage}%`;
            }

            // Update modal content if modal exists
            updateFriendshipModal(summary);

            console.log('[Webview] Friendship display updated:', displayString);
        } catch (error) {
            console.error('[Webview] Error updating friendship display:', error);
        }
    }

    function updateFriendshipModal(summary) {
        // Update category percentages and progress bars
        const categories = ['chat', 'prompts', 'notifications'];
        const categoryData = {
            chat: summary.categories.chat,
            prompts: summary.categories.prompts,
            notifications: summary.categories.notifications
        };

        categories.forEach(category => {
            const data = categoryData[category];
            if (data) {
                // Update percentage text
                const percentElement = document.getElementById(`${category}Percent`);
                if (percentElement) {
                    percentElement.textContent = `${data.percentage}%`;
                }

                // Update progress bar width
                const progressElement = document.getElementById(`${category}Progress`);
                if (progressElement) {
                    progressElement.style.width = `${data.percentage}%`;
                }
            }
        });

        // Update overall stats
        const totalPointsElement = document.getElementById('totalPoints');
        if (totalPointsElement) {
            totalPointsElement.textContent = summary.totalPoints || 0;
        }

        const averageLevelElement = document.getElementById('averageLevel');
        if (averageLevelElement) {
            averageLevelElement.textContent = `${summary.averagePercentage || 0}%`;
        }

        // Update recent activity
        updateRecentActivity(summary.recentHistory || []);
    }

    function updateRecentActivity(history) {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        if (history.length === 0) {
            activityList.innerHTML = '<div class="friendship-activity-empty">No recent activity</div>';
            return;
        }

        const activityHtml = history.map(entry => {
            const categoryIcons = {
                chat: '💬',
                prompts: '⚡',
                notifications: '🔔'
            };

            const icon = categoryIcons[entry.category] || '📝';
            const timeAgo = formatTimeAgo(entry.timestamp);

            return `
                <div class="friendship-activity-item">
                    <span class="friendship-activity-icon">${icon}</span>
                    <span class="friendship-activity-text">${entry.description}</span>
                    <span class="friendship-activity-time">${timeAgo}</span>
                </div>
            `;
        }).join('');

        activityList.innerHTML = activityHtml;
    }

    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    function openFriendshipModal() {
        const modal = document.getElementById('friendshipModal');
        console.log('[Webview] Opening friendship modal, modal element:', modal ? 'Found' : 'Not found');
        if (modal) {
            modal.style.display = 'flex';

            // Set up modal-specific event listeners now that modal is visible
            setupModalEventListeners();

            // Request latest friendship data
            vscode.postMessage({
                command: 'getFriendshipData'
            });

            console.log('[Webview] Opened friendship modal');
        }
    }

    function setupModalEventListeners() {
        console.log('[Webview] Setting up modal event listeners...');

        // Debug: Check what elements exist in the modal
        const modal = document.getElementById('friendshipModal');
        console.log('[Webview] Modal element:', modal ? 'Found' : 'Not found');

        if (modal) {
            const allButtons = modal.querySelectorAll('button');
            console.log('[Webview] Found buttons in modal:', allButtons.length);
            allButtons.forEach((btn, index) => {
                console.log(`[Webview] Button ${index}: id="${btn.id}", class="${btn.className}", text="${btn.textContent}"`);
            });
        }

        // Reset button (set up each time modal opens to ensure it exists)
        const resetBtn = document.getElementById('friendshipResetBtn');
        console.log('[Webview] Reset button element:', resetBtn ? 'Found' : 'Not found');

        if (resetBtn) {
            console.log('[Webview] Reset button details:', {
                id: resetBtn.id,
                className: resetBtn.className,
                textContent: resetBtn.textContent,
                title: resetBtn.title
            });

            // Remove existing listener to avoid duplicates
            resetBtn.removeEventListener('click', resetFriendship);
            resetBtn.addEventListener('click', resetFriendship);
            console.log('[Webview] Reset button event listener attached successfully');

            // Test click programmatically to verify
            console.log('[Webview] Testing reset button click handler...');
        } else {
            console.log('[Webview] ERROR: Reset button element not found in modal');

            // Debug: Try to find it by class name
            const resetByClass = document.querySelector('.friendship-reset-btn');
            console.log('[Webview] Reset button by class:', resetByClass ? 'Found' : 'Not found');
        }

        // Close button (backup, should already be set up in setupFriendshipListeners)
        const modalClose = document.getElementById('friendshipModalClose');
        if (modalClose) {
            console.log('[Webview] Close button confirmed available');
        } else {
            console.log('[Webview] Warning: Close button not found');
        }
    }

    function closeFriendshipModal() {
        const modal = document.getElementById('friendshipModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('[Webview] Closed friendship modal');
        }
    }

    function resetFriendship() {
        // Visual feedback for click detection
        const resetBtn = document.getElementById('friendshipResetBtn');
        if (resetBtn) {
            resetBtn.textContent = '✅'; // Show click detected
            setTimeout(() => {
                resetBtn.textContent = '🔄'; // Change back
            }, 500);
        }

        // Skip confirm dialog (blocked by VS Code webview security) and reset immediately
        // For testing purposes, this is acceptable

        // Send reset command to extension
        vscode.postMessage({
            command: 'resetFriendship'
        });

        // Visual feedback for reset sent
        if (resetBtn) {
            setTimeout(() => {
                resetBtn.textContent = '✨'; // Show reset sent
                setTimeout(() => {
                    resetBtn.textContent = '🔄'; // Back to normal
                }, 1500);
            }, 600);
        }
    }

    function setupFriendshipListeners() {
        console.log('[Webview] *** SETUP FRIENDSHIP LISTENERS STARTED ***');

        // Check if basic elements exist first
        const friendshipCompact = document.getElementById('friendshipCompact');
        console.log('[Webview] Friendship bar element:', friendshipCompact ? 'FOUND' : 'NOT FOUND');

        if (friendshipCompact) {
            friendshipCompact.addEventListener('click', function() {
                console.log('[Webview] *** FRIENDSHIP BAR CLICKED ***');
                openFriendshipModal();
            });
            console.log('[Webview] Friendship bar click listener added');
        }

        // Modal backdrop click to close modal
        const modalBackdrop = document.getElementById('friendshipModalBackdrop');
        console.log('[Webview] Modal backdrop element:', modalBackdrop ? 'FOUND' : 'NOT FOUND');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeFriendshipModal);
        }

        // Modal close button click to close modal
        const modalClose = document.getElementById('friendshipModalClose');
        console.log('[Webview] Modal close element:', modalClose ? 'FOUND' : 'NOT FOUND');
        if (modalClose) {
            modalClose.addEventListener('click', closeFriendshipModal);
        }

        console.log('[Webview] *** FRIENDSHIP LISTENERS SETUP COMPLETE ***');
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

    // Initialize default customization (without saving)
    function initializeCustomization() {
        // Initialize with cyberpunk theme, color picker defaults, modern hair style
        // Use skipSave=true to prevent saving defaults before loading saved config
        changeCharacterStyle('cyberpunk', true);

        // Set initial colors to match color picker defaults
        changeSkinColorHex('#C0C0C0', true);  // Silver/gray default
        changeHairStyle('4', true); // Clean Cut style
        changeHairColorHex('#8B4513', true);  // Brown hair default
        changeEyeColorHex('#ec4899', true);   // Pink eyes as requested
        changeAccessoryColorHex('#E74C3C', true);  // Red accessory default

        // Initialize individual accessory colors to match color picker defaults
        changeGlassesColorHex('#E74C3C', true);    // Red glasses
        changeEarringsColorHex('#FFD700', true);   // Gold earrings
        changeCatColorHex('#FF8C42', true);        // Orange cat
        changeDogColorHex('#8B4513', true);        // Brown dog

        // Initialize clothing colors to match color picker defaults
        changeTopColorHex('#3498DB', true);    // Blue tank top
        changeBottomColorHex('#2C3E50', true); // Dark blue pants
        changeShoeColorHex('#1A1A1A', true);   // Black dress shoes

        changeAccessory('none');
        changeExpression('neutral', true);
    }

    // LocalStorage functions for avatar configuration
    function getAvatarConfig() {
        const config = {
            style: document.querySelector('.style-btn.active')?.dataset.style || 'cyberpunk',
            skinColor: getComputedStyle(document.documentElement).getPropertyValue('--skin-color').trim(),
            hairStyle: [...document.querySelectorAll('.hair-style')].find(el => el.classList.contains('active'))?.id.replace('hair-style-', '') || '4',
            hairColor: getComputedStyle(document.documentElement).getPropertyValue('--hair-color').trim(),
            eyeColor: getComputedStyle(document.documentElement).getPropertyValue('--eye-color').trim(),
            topStyle: [...document.querySelectorAll('.top-style')].find(el => el.classList.contains('active'))?.id.replace('top-', '') || 'tank',
            topColor: getComputedStyle(document.documentElement).getPropertyValue('--top-color').trim(),
            bottomStyle: [...document.querySelectorAll('.bottom-style')].find(el => el.classList.contains('active'))?.id.replace('bottom-', '') || 'jeans',
            bottomColor: getComputedStyle(document.documentElement).getPropertyValue('--bottom-color').trim(),
            shoeStyle: [...document.querySelectorAll('.shoe-style')].find(el => el.classList.contains('active'))?.id.replace('shoe-', '') || 'sneakers',
            shoeColor: getComputedStyle(document.documentElement).getPropertyValue('--shoe-color').trim(),
            expression: [...document.querySelectorAll('.expression')].find(el => el.classList.contains('active'))?.id.replace('mouth-', '') || 'neutral',
            accessories: {
                glasses: document.getElementById('accessory-glasses')?.classList.contains('active') || false,
                glassesColor: getComputedStyle(document.documentElement).getPropertyValue('--glasses-color').trim(),
                earrings: document.getElementById('accessory-earrings')?.classList.contains('active') || false,
                earringsColor: getComputedStyle(document.documentElement).getPropertyValue('--earrings-color').trim(),
                cat: document.getElementById('accessory-cat')?.classList.contains('active') || false,
                catColor: getComputedStyle(document.documentElement).getPropertyValue('--cat-color').trim(),
                dog: document.getElementById('accessory-dog')?.classList.contains('active') || false,
                dogColor: getComputedStyle(document.documentElement).getPropertyValue('--dog-color').trim()
            }
        };
        return config;
    }

    function saveAvatarConfig() {
        const config = getAvatarConfig();
        vscode.postMessage({
            command: 'saveAvatarConfig',
            config: config
        });
        console.log('Avatar config sent to extension for saving:', config);
    }

    function loadAvatarConfig(config) {
        if (!config) {
            console.log('No config provided to load');
            return false;
        }

        console.log('Loading avatar config:', config);

        // Apply style theme first (this also updates some color pickers)
        if (config.style) {
            changeCharacterStyle(config.style, true);
            const styleBtn = document.querySelector(`[data-style="${config.style}"]`);
            if (styleBtn) updateActiveButton('.style-btn', styleBtn);
        }

        // Apply colors and update color pickers
        if (config.skinColor) {
            changeSkinColorHex(config.skinColor, true);
            const skinPicker = document.getElementById('skinColorPicker');
            if (skinPicker) skinPicker.value = config.skinColor;
        }
        if (config.hairColor) {
            changeHairColorHex(config.hairColor, true);
            const hairPicker = document.getElementById('hairColorPicker');
            if (hairPicker) hairPicker.value = config.hairColor;
        }
        if (config.eyeColor) {
            changeEyeColorHex(config.eyeColor, true);
            const eyePicker = document.getElementById('eyeColorPicker');
            if (eyePicker) eyePicker.value = config.eyeColor;
        }
        if (config.topColor) {
            changeTopColorHex(config.topColor, true);
            const topPicker = document.getElementById('topColorPicker');
            if (topPicker) topPicker.value = config.topColor;
        }
        if (config.bottomColor) {
            changeBottomColorHex(config.bottomColor, true);
            const bottomPicker = document.getElementById('bottomColorPicker');
            if (bottomPicker) bottomPicker.value = config.bottomColor;
        }
        if (config.shoeColor) {
            changeShoeColorHex(config.shoeColor, true);
            const shoePicker = document.getElementById('shoeColorPicker');
            if (shoePicker) shoePicker.value = config.shoeColor;
        }

        // Apply styles
        if (config.hairStyle) {
            changeHairStyle(config.hairStyle, true);
            const hairBtn = document.querySelector(`[data-hair-style="${config.hairStyle}"]`);
            if (hairBtn) updateActiveButton('[data-hair-style]', hairBtn);
        }
        if (config.topStyle) {
            changeTopStyle(config.topStyle, true);
            const topBtn = document.querySelector(`[data-top="${config.topStyle}"]`);
            if (topBtn) updateActiveButton('[data-top]', topBtn);
        }
        if (config.bottomStyle) {
            changeBottomStyle(config.bottomStyle, true);
            const bottomBtn = document.querySelector(`[data-bottom="${config.bottomStyle}"]`);
            if (bottomBtn) updateActiveButton('[data-bottom]', bottomBtn);
        }
        if (config.shoeStyle) {
            changeShoeStyle(config.shoeStyle, true);
            const shoeBtn = document.querySelector(`[data-shoe="${config.shoeStyle}"]`);
            if (shoeBtn) updateActiveButton('[data-shoe]', shoeBtn);
        }
        if (config.expression) {
            changeExpression(config.expression, true);
            const expressionBtn = document.querySelector(`[data-expression="${config.expression}"]`);
            if (expressionBtn) updateActiveButton('[data-expression]', expressionBtn);
        }

        // Apply accessories and their colors
        if (config.accessories) {
            if (config.accessories.glasses) {
                toggleAccessory('glasses', true);
                const glassesBtn = document.querySelector('[data-accessory="glasses"]');
                if (glassesBtn) glassesBtn.classList.add('active');
            }
            if (config.accessories.glassesColor) {
                changeGlassesColorHex(config.accessories.glassesColor, true);
                const glassesPicker = document.getElementById('glassesColorPicker');
                if (glassesPicker) glassesPicker.value = config.accessories.glassesColor;
            }

            if (config.accessories.earrings) {
                toggleAccessory('earrings', true);
                const earringsBtn = document.querySelector('[data-accessory="earrings"]');
                if (earringsBtn) earringsBtn.classList.add('active');
            }
            if (config.accessories.earringsColor) {
                changeEarringsColorHex(config.accessories.earringsColor, true);
                const earringsPicker = document.getElementById('earringsColorPicker');
                if (earringsPicker) earringsPicker.value = config.accessories.earringsColor;
            }

            if (config.accessories.cat) {
                toggleAccessory('cat', true);
                const catBtn = document.querySelector('[data-accessory="cat"]');
                if (catBtn) catBtn.classList.add('active');
            }
            if (config.accessories.catColor) {
                changeCatColorHex(config.accessories.catColor, true);
                const catPicker = document.getElementById('catColorPicker');
                if (catPicker) catPicker.value = config.accessories.catColor;
            }

            if (config.accessories.dog) {
                toggleAccessory('dog', true);
                const dogBtn = document.querySelector('[data-accessory="dog"]');
                if (dogBtn) dogBtn.classList.add('active');
            }
            if (config.accessories.dogColor) {
                changeDogColorHex(config.accessories.dogColor, true);
                const dogPicker = document.getElementById('dogColorPicker');
                if (dogPicker) dogPicker.value = config.accessories.dogColor;
            }
        }

        return true;
    }

    // Main initialization function
    function initialize() {
        console.log('[Webview] *** INITIALIZE FUNCTION CALLED ***');

        // Get DOM elements
        messagesContainer = document.getElementById('messages');
        messageInput = document.getElementById('messageInput');
        sendButton = document.getElementById('sendButton');
        successSoundButton = document.getElementById('successSoundButton');
        failureSoundButton = document.getElementById('failureSoundButton');
        alertSoundButton = document.getElementById('alertSoundButton');

        console.log('[Webview] Basic elements found:', {
            messagesContainer: !!messagesContainer,
            messageInput: !!messageInput,
            sendButton: !!sendButton,
            successSoundButton: !!successSoundButton,
            failureSoundButton: !!failureSoundButton,
            alertSoundButton: !!alertSoundButton
        });

        // Initialize all modules with defaults
        // The extension will send loadAvatarConfig message if saved config exists
        initializeCustomization();

        // Setup event listeners
        console.log('[Webview] Setting up event listeners...');
        setupNavigationListeners();
        setupMessagingListeners();
        setupCustomizationListeners();
        setupFriendshipListeners(); // This should log
        setupLetscodeButton();

        // Initialize UI state
        updateFriendshipTooltip();
        showPanel(0); // Start with first panel

        // Add initial welcome message
        addMessage('Hi there! I\'m Claude Buddy! 🩵✨ I\'m SO excited to meet you and build an amazing friendship together! 🤗 What\'s your name? I\'d love to get to know you better! Our friendship meter is at 0% right now, but I have a feeling we\'re going to be great friends! 🌟', 'buddy');

        // Signal to extension that webview is ready
        console.log('[Webview] Sending webviewReady signal');
        vscode.postMessage({
            command: 'webviewReady'
        });

        console.log('[Webview] *** INITIALIZE COMPLETE ***');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();