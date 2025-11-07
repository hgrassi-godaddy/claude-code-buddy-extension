// Sound Service - Reusable sound utilities using Web Audio API
// No external audio files needed - all sounds are synthesized

const SoundService = (function() {
    'use strict';

    // Sound types enum
    const SoundType = {
        SUCCESS: 'success',
        FAILURE: 'failure',
        ALERT: 'alert',
        NOTIFICATION: 'notification',
        CLICK: 'click',
        ERROR: 'error'
    };

    /**
     * Play a success sound - two ascending notes (C5 -> E5)
     * Use for: successful operations, completed tasks, passed tests
     */
    function playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            // First note (C5 - 523 Hz)
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            osc1.frequency.value = 523;
            osc1.type = 'sine';
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
            gain1.gain.linearRampToValueAtTime(0, now + 0.1);
            osc1.start(now);
            osc1.stop(now + 0.1);
            
            // Second note (E5 - 659 Hz) - slightly delayed
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 659;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0, now + 0.08);
            gain2.gain.linearRampToValueAtTime(0.3, now + 0.09);
            gain2.gain.linearRampToValueAtTime(0, now + 0.2);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.2);
            
            console.log('[SoundService] Played success sound');
        } catch (error) {
            console.error('[SoundService] Error playing success sound:', error);
        }
    }

    /**
     * Play a failure sound - two descending notes (E5 -> C5)
     * Use for: failed operations, errors, cancelled actions
     */
    function playFailureSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            // First note (E5 - 659 Hz)
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            osc1.frequency.value = 659;
            osc1.type = 'sine';
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.25, now + 0.01);
            gain1.gain.linearRampToValueAtTime(0, now + 0.1);
            osc1.start(now);
            osc1.stop(now + 0.1);
            
            // Second note (C5 - 523 Hz) - slightly delayed
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 523;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0, now + 0.08);
            gain2.gain.linearRampToValueAtTime(0.25, now + 0.09);
            gain2.gain.linearRampToValueAtTime(0, now + 0.2);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.2);
            
            console.log('[SoundService] Played failure sound');
        } catch (error) {
            console.error('[SoundService] Error playing failure sound:', error);
        }
    }

    /**
     * Play an alert sound - three rapid beeps (A5 x 3)
     * Use for: urgent notifications, warnings, attention needed
     */
    function playAlertSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            const frequency = 880; // A5 - higher pitch for urgency
            
            // First beep
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            osc1.frequency.value = frequency;
            osc1.type = 'square';
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.2, now + 0.01);
            gain1.gain.linearRampToValueAtTime(0, now + 0.08);
            osc1.start(now);
            osc1.stop(now + 0.08);
            
            // Second beep
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = frequency;
            osc2.type = 'square';
            gain2.gain.setValueAtTime(0, now + 0.12);
            gain2.gain.linearRampToValueAtTime(0.2, now + 0.13);
            gain2.gain.linearRampToValueAtTime(0, now + 0.2);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.2);
            
            // Third beep
            const osc3 = audioContext.createOscillator();
            const gain3 = audioContext.createGain();
            osc3.connect(gain3);
            gain3.connect(audioContext.destination);
            osc3.frequency.value = frequency;
            osc3.type = 'square';
            gain3.gain.setValueAtTime(0, now + 0.24);
            gain3.gain.linearRampToValueAtTime(0.2, now + 0.25);
            gain3.gain.linearRampToValueAtTime(0, now + 0.35);
            osc3.start(now + 0.24);
            osc3.stop(now + 0.35);
            
            console.log('[SoundService] Played alert sound');
        } catch (error) {
            console.error('[SoundService] Error playing alert sound:', error);
        }
    }

    /**
     * Play a notification sound - single pleasant beep
     * Use for: new messages, general notifications, info alerts
     */
    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // 800 Hz - friendly tone
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            
            console.log('[SoundService] Played notification sound');
        } catch (error) {
            console.error('[SoundService] Error playing notification sound:', error);
        }
    }

    /**
     * Play a click sound - short soft click
     * Use for: button clicks, UI interactions
     */
    function playClickSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1000; // 1000 Hz - sharp click
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.005);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
            
            oscillator.start(now);
            oscillator.stop(now + 0.05);
            
            console.log('[SoundService] Played click sound');
        } catch (error) {
            console.error('[SoundService] Error playing click sound:', error);
        }
    }

    /**
     * Play an error sound - harsh buzzer
     * Use for: critical errors, invalid input, blocked actions
     */
    function playErrorSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200; // 200 Hz - low, harsh tone
            oscillator.type = 'sawtooth'; // Harsh waveform
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            
            console.log('[SoundService] Played error sound');
        } catch (error) {
            console.error('[SoundService] Error playing error sound:', error);
        }
    }

    /**
     * Play a custom sound with specified parameters
     * @param {Object} options - Sound configuration
     * @param {number} options.frequency - Frequency in Hz (default: 440)
     * @param {string} options.type - Oscillator type: 'sine', 'square', 'sawtooth', 'triangle' (default: 'sine')
     * @param {number} options.duration - Duration in seconds (default: 0.2)
     * @param {number} options.volume - Volume 0-1 (default: 0.3)
     */
    function playCustomSound(options = {}) {
        try {
            const {
                frequency = 440,
                type = 'sine',
                duration = 0.2,
                volume = 0.3
            } = options;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
            
            console.log('[SoundService] Played custom sound:', options);
        } catch (error) {
            console.error('[SoundService] Error playing custom sound:', error);
        }
    }

    /**
     * Play a sound by type name
     * @param {string} soundType - One of SoundType enum values
     */
    function playSound(soundType) {
        switch (soundType) {
            case SoundType.SUCCESS:
                playSuccessSound();
                break;
            case SoundType.FAILURE:
                playFailureSound();
                break;
            case SoundType.ALERT:
                playAlertSound();
                break;
            case SoundType.NOTIFICATION:
                playNotificationSound();
                break;
            case SoundType.CLICK:
                playClickSound();
                break;
            case SoundType.ERROR:
                playErrorSound();
                break;
            default:
                console.warn('[SoundService] Unknown sound type:', soundType);
        }
    }

    // Public API
    return {
        // Sound types enum
        SoundType: SoundType,
        
        // Individual sound functions
        playSuccessSound: playSuccessSound,
        playFailureSound: playFailureSound,
        playAlertSound: playAlertSound,
        playNotificationSound: playNotificationSound,
        playClickSound: playClickSound,
        playErrorSound: playErrorSound,
        
        // Utility functions
        playCustomSound: playCustomSound,
        playSound: playSound
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SoundService = SoundService;
}
