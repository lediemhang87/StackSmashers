const startOverlay = document.getElementById('startOverlay');
const awaitingOverlay = document.getElementById('awaitingOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Start the game when clicking the Start button
startButton1.addEventListener('click', async () => {
    startOverlay.style.display = 'none';
    // Show loading screen
    awaitingOverlay.style.visibility = 'visible'; 

    await import('./game1.js');

    // Hide loading screen and start the game
    awaitingOverlay.style.visibility = 'hidden';
});

startButton2.addEventListener('click', async () => {
    startOverlay.style.display = 'none';
    // Show loading screen
    awaitingOverlay.style.visibility = 'visible'; 

    await import('./game2.js');

    // Hide loading screen and start the game
    awaitingOverlay.style.visibility = 'hidden';
});


// Restart the game when clicking the Restart button
restartButton.addEventListener('click', async () => {
    gameOverOverlay.style.visibility = 'hidden';
    location.reload();
});

export function showGameOver() {
    gameOverOverlay.style.visibility = 'visible';

}
