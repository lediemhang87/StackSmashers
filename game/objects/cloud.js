import * as THREE from 'three';
import scene from '../settings/scene';
export function createMovingCloudWithTexture(texturePath, startDirection = "left", currentHeight) {
    const cloudSize = Math.random() * 10 + 10; // Random size
    // Load the cloud texture

    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load(texturePath, (texture) => {
        // Adjust scale based on the texture's aspect ratio
        const aspect = texture.image.width / texture.image.height;
        cloud.scale.set(cloudSize * aspect, cloudSize, 1); // Scale width by aspect ratio
    });


    // Create a sprite for the cloud

    const cloudMaterial = new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.8, // Slight transparency for a soft look
    });
    const cloud = new THREE.Sprite(cloudMaterial);

    // Set initial position based on the direction
    const startX = startDirection === "left" ? -50 : 50; // Start off-screen
    const startY = Math.random() * (10 - 0) + 5 + currentHeight; // max 30 + height, min is height
    const startZ = 10; // Random depth
    cloud.position.set(startX, startY, startZ);
    // Set cloud size

    

    cloud.scale.set(cloudSize, cloudSize, 1);
    // Add the cloud to the scene
    scene.add(cloud);
    // Set cloud speed
    const cloudSpeed = Math.random() * 0.1 + 0.05; 

    // Animate the cloud
    function animateCloud() {
        cloud.position.x += startDirection === "left" ? cloudSpeed : -cloudSpeed;
        cloud.position.z -= cloudSpeed;
        // Remove the cloud when it moves out of view
        if (cloud.position.x > 50 || cloud.position.x < -50 || cloud.position.y < -10) {
            scene.remove(cloud);
        } else {
            requestAnimationFrame(animateCloud);
        }
    }
    animateCloud();

}