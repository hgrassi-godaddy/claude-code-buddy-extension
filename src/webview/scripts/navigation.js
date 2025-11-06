import { customizationPanels, panelTitles } from './constants.js';

let currentPanelIndex = 0;

export function getCurrentPanelIndex() {
    return currentPanelIndex;
}

export function setCurrentPanelIndex(index) {
    currentPanelIndex = index;
}

export function showPanel(index) {
    // Hide all panels
    customizationPanels.forEach(panelId => {
        document.getElementById(panelId).classList.remove('active');
    });

    // Show current panel
    document.getElementById(customizationPanels[index]).classList.add('active');

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

export function setupNavigationListeners() {
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