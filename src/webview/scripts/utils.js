// Utility functions
window.ClaudeBuddy = window.ClaudeBuddy || {};
window.ClaudeBuddy.utils = {};

window.ClaudeBuddy.utils.triggerHappyAnimation = function() {
    const cyborgBody = document.querySelector('.cyborg-body');
    if (cyborgBody) {
        cyborgBody.style.animation = 'none';
        setTimeout(() => {
            cyborgBody.style.animation = 'cyborgFloat 3s ease-in-out infinite';
        }, 10);
    }
};

window.ClaudeBuddy.utils.setRootProperty = function(property, value) {
    const root = document.documentElement;
    root.style.setProperty(property, value);
};

window.ClaudeBuddy.utils.toggleElementActiveClass = function(element) {
    if (!element) return;

    if (element.classList.contains('active')) {
        element.classList.remove('active');
        return false;
    } else {
        element.classList.add('active');
        return true;
    }
};

window.ClaudeBuddy.utils.hideAllElements = function(selector) {
    document.querySelectorAll(selector).forEach(element => {
        element.classList.remove('active');
    });
};

window.ClaudeBuddy.utils.showElement = function(selector) {
    const element = document.getElementById(selector);
    if (element) {
        element.classList.add('active');
    }
    return element;
};

window.ClaudeBuddy.utils.updateActiveButton = function(selector, activeElement) {
    document.querySelectorAll(selector).forEach(btn => btn.classList.remove('active'));
    if (activeElement) {
        activeElement.classList.add('active');
    }
};