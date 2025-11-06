import { styleThemes, skinColors, hairColors, eyeColors } from './constants.js';
import { triggerHappyAnimation, setRootProperty, hideAllElements, showElement, updateActiveButton } from './utils.js';

// Character customization functions

export function changeCharacterStyle(styleName) {
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

export function changeSkinColor(colorName) {
    const color = skinColors[colorName];
    if (!color) return;

    setRootProperty('--skin-color', color);
    triggerHappyAnimation();
}

export function changeHairColor(colorName) {
    const color = hairColors[colorName];
    if (!color) return;

    setRootProperty('--hair-color', color);
    triggerHappyAnimation();
}

export function changeHairStyle(styleNumber) {
    hideAllElements('.hair-style');
    showElement(`hair-style-${styleNumber}`);
    triggerHappyAnimation();
}

export function changeEyeColor(colorName) {
    const color = eyeColors[colorName];
    if (!color) return;

    setRootProperty('--eye-color', color);
    triggerHappyAnimation();
}

// Color picker functions for hex values
export function changeSkinColorHex(hexColor) {
    setRootProperty('--skin-color', hexColor);
    triggerHappyAnimation();
}

export function changeHairColorHex(hexColor) {
    setRootProperty('--hair-color', hexColor);
    triggerHappyAnimation();
}

export function changeEyeColorHex(hexColor) {
    setRootProperty('--eye-color', hexColor);
    triggerHappyAnimation();
}

export function changeAccessoryColorHex(hexColor) {
    setRootProperty('--accessory-color', hexColor);
    triggerHappyAnimation();
}

// Individual accessory color functions
export function changeGlassesColorHex(hexColor) {
    setRootProperty('--glasses-color', hexColor);
    triggerHappyAnimation();
}

export function changeEarringsColorHex(hexColor) {
    setRootProperty('--earrings-color', hexColor);
    triggerHappyAnimation();
}

export function changeCatColorHex(hexColor) {
    setRootProperty('--cat-color', hexColor);
    triggerHappyAnimation();
}

export function changeDogColorHex(hexColor) {
    setRootProperty('--dog-color', hexColor);
    triggerHappyAnimation();
}

// Clothing color functions
export function changeTopColorHex(hexColor) {
    setRootProperty('--top-color', hexColor);
    triggerHappyAnimation();
}

export function changeBottomColorHex(hexColor) {
    setRootProperty('--bottom-color', hexColor);
    triggerHappyAnimation();
}

export function changeShoeColorHex(hexColor) {
    setRootProperty('--shoe-color', hexColor);
    triggerHappyAnimation();
}

// Clothing style functions
export function changeTopStyle(styleName) {
    hideAllElements('.top-style');
    showElement(`top-${styleName}`);
    triggerHappyAnimation();
}

export function changeBottomStyle(styleName) {
    hideAllElements('.bottom-style');
    showElement(`bottom-${styleName}`);
    triggerHappyAnimation();
}

export function changeShoeStyle(styleName) {
    hideAllElements('.shoe-style');
    showElement(`shoe-${styleName}`);
    triggerHappyAnimation();
}

export function toggleAccessory(accessoryName) {
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
export function changeAccessory(accessoryName) {
    hideAllElements('.accessory');

    if (accessoryName !== 'none') {
        showElement(`accessory-${accessoryName}`);
    }

    triggerHappyAnimation();
}

export function changeExpression(expressionName) {
    hideAllElements('.expression');
    showElement(`mouth-${expressionName}`);
    triggerHappyAnimation();
}

// Setup customization event listeners
export function setupCustomizationListeners() {
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

// Initialize default customization
export function initializeCustomization() {
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