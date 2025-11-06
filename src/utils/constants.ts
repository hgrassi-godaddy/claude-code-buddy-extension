// Extension-wide constants

export const EXTENSION_ID = 'claude-buddy';
export const EXTENSION_NAME = 'Claude Buddy';

// Commands
export const COMMANDS = {
    OPEN_PANEL: `${EXTENSION_ID}.openPanel`,
    REFRESH_PANEL: `${EXTENSION_ID}.refreshPanel`,
    RESET_CUSTOMIZATION: `${EXTENSION_ID}.resetCustomization`
} as const;

// View IDs
export const VIEW_IDS = {
    BUDDY_PANEL: 'claudeBuddyPanel'
} as const;

// File paths (relative to extension root)
export const PATHS = {
    TEMPLATES: {
        WEBVIEW: 'src/templates/webview.html'
    },
    ASSETS: {
        AVATAR_SVG: 'src/webview/assets/buddy-avatar.svg'
    },
    STYLES: {
        MAIN: 'src/webview/styles/main.css',
        BUDDY: 'src/webview/styles/buddy.css',
        CHAT: 'src/webview/styles/chat.css',
        NAVIGATION: 'src/webview/styles/navigation.css',
        ANIMATIONS: 'src/webview/styles/animations.css'
    },
    SCRIPTS: {
        MAIN: 'src/webview/scripts/main.js',
        CONSTANTS: 'src/webview/scripts/constants.js',
        UTILS: 'src/webview/scripts/utils.js',
        NAVIGATION: 'src/webview/scripts/navigation.js',
        CUSTOMIZATION: 'src/webview/scripts/customization.js',
        MESSAGING: 'src/webview/scripts/messaging.js',
        FRIENDSHIP: 'src/webview/scripts/friendship.js'
    }
} as const;

// Default configuration values
export const DEFAULTS = {
    THEME: 'cyberpunk',
    SKIN_COLOR: '#C0C0C0',
    HAIR_STYLE: '4',
    HAIR_COLOR: '#8B4513',
    EYE_COLOR: '#ec4899',
    TOP_STYLE: 'tanktop',
    TOP_COLOR: '#3498DB',
    BOTTOM_STYLE: 'pants',
    BOTTOM_COLOR: '#2C3E50',
    SHOE_COLOR: '#1A1A1A',
    EXPRESSION: 'neutral',
    FRIENDSHIP_PERCENTAGE: 0
} as const;

// Chat configuration
export const CHAT_CONFIG = {
    MAX_MESSAGES: 100,
    TYPING_DELAY_BASE: 1000,
    TYPING_DELAY_PER_CHAR: 20,
    MAX_TYPING_DELAY: 3000
} as const;

// Friendship levels
export const FRIENDSHIP_LEVELS = [
    { min: 0, max: 9, message: 'Just Getting Started! 👋' },
    { min: 10, max: 19, message: 'Building Friendship! 🤝' },
    { min: 20, max: 39, message: 'Getting Along Well! 👍' },
    { min: 40, max: 59, message: 'Good Friends! 😊' },
    { min: 60, max: 79, message: 'Close Friends! 💫' },
    { min: 80, max: 89, message: 'Best Friends Forever! 🌟' },
    { min: 90, max: 100, message: 'Inseparable Buddies! 🌟💎' }
] as const;

// CSS Custom Property names
export const CSS_VARS = {
    SKIN_COLOR: '--skin-color',
    HAIR_COLOR: '--hair-color',
    EYE_COLOR: '--eye-color',
    CYBER_COLOR: '--cyber-color',
    JACKET_COLOR: '--jacket-color',
    PANTS_COLOR: '--pants-color',
    OUTLINE_COLOR: '--outline-color',
    TOP_COLOR: '--top-color',
    BOTTOM_COLOR: '--bottom-color',
    SHOE_COLOR: '--shoe-color',
    ACCESSORY_COLOR: '--accessory-color',
    GLASSES_COLOR: '--glasses-color',
    EARRINGS_COLOR: '--earrings-color',
    CAT_COLOR: '--cat-color',
    DOG_COLOR: '--dog-color',
    MOUTH_COLOR: '--mouth-color'
} as const;

// Animation configuration
export const ANIMATIONS = {
    CYBORG_FLOAT: 'cyborgFloat 3s ease-in-out infinite',
    CYBORG_BOB: 'cyborgBob 2.5s ease-in-out infinite',
    CYBORG_BLINK: 'cyborgBlink 4s ease-in-out infinite',
    HAIR_SWAY: 'hairSway 3.5s ease-in-out infinite',
    CYBER_PULSE: 'cyberPulse 2s ease-in-out infinite',
    SLIDE_IN: 'slideIn 0.3s ease'
} as const;

// Error messages
export const ERROR_MESSAGES = {
    TEMPLATE_NOT_FOUND: 'HTML template file not found',
    AVATAR_NOT_FOUND: 'Avatar SVG file not found',
    STYLE_NOT_FOUND: 'CSS style file not found',
    SCRIPT_NOT_FOUND: 'JavaScript file not found',
    INVALID_THEME: 'Invalid theme specified',
    INVALID_COLOR: 'Invalid color value',
    PROMPT_HISTORY_ERROR: 'Failed to load prompt history'
} as const;