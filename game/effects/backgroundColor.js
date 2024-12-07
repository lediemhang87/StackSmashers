import * as THREE from 'three';

export function rgbDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export function createVerticalGradientTexture(baseColor, upperColor) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create gradient from base color to grey
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, upperColor); // Bottom color (current block color)
    gradient.addColorStop(1,  baseColor.getStyle()); // Top color (grey)

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export function getRandomColorExcludingNavyBlue() {
    let color;
    do {
        // Generate a random color
        color = new THREE.Color(Math.random(), Math.random(), Math.random());
    } while (isCloseToNavyBlue(color));  // Keep trying until it's not navy blue
    return color;
}

export function isCloseToNavyBlue(color) {
    // Navy blue is approximately rgb(0, 0, 128) or #000080
    const navyBlue = new THREE.Color(0, 0, 128);
    return rgbDistance(color, navyBlue) < 0.1; // Threshold for "closeness"
}
