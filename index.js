const startOverlay = document.getElementById('startOverlay');
const awaitingOverlay = document.getElementById('awaitingOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const restartLevelButton = document.getElementById('restartLevelButton');
import { resetGame } from './game1.js';
import { initAudio } from './game/effects/audio.js';


// Start the game when clicking the Start button
startButton1.addEventListener('click', async () => {
    startOverlay.style.display = 'none';
    // Show loading screen
    awaitingOverlay.style.visibility = 'visible';
    score.style.visibility = 'visible';

    await import('./game1.js');
    initAudio();
    // Hide loading screen and start the game
    awaitingOverlay.style.visibility = 'hidden';
});

// startButton2.addEventListener('click', async () => {
//     const rendererDom = document.querySelector('canvas');
//     if (rendererDom) {
//         rendererDom.parentNode.removeChild(rendererDom);
//     }
//     // Optionally, call a cleanup function from game1.js to dispose of objects
//     if (typeof cleanupGame1 === 'function') {
//         cleanupGame1();
//     }
//     startOverlay.style.display = 'none';
//     // Show loading screen
//     awaitingOverlay.style.visibility = 'visible'; 

//     await import('./game2.js');
//     // Hide loading screen and start the game
//     awaitingOverlay.style.visibility = 'hidden';
// });


// Restart the game when clicking the Restart button
restartButton.addEventListener('click', async () => {
    gameOverOverlay.style.visibility = 'hidden';
    location.reload();
});

// Restart the game when clicking the Restart button
restartLevelButton.addEventListener('click', async () => {
    gameOverOverlay.style.visibility = 'hidden';
    resetGame();
    // await import('./game1.js');
});

export function showGameOver() {
    gameOverOverlay.style.visibility = 'visible';

}
