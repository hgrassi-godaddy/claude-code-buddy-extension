// Friendship system

export function updateFriendshipTooltip() {
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