
import * as THREE from 'three';
import { showGameOver } from './index.js';
import * as CANNON from 'cannon-es';
// import CannonDebugger from 'cannon-es-debugger';

import scene from './game/settings/scene.js';
import world from './game/settings/world.js';
import renderer from './game/settings/renderer.js';

import { initAudio, playPerfectSound, playPlaceSound } from './game/effects/audio.js';
import { createRippleEffect } from './game/effects/effects.js';
import { createMovingCloudWithTexture } from './game/objects/cloud.js';
import { ambientLight, directionalLight, camera, frustumSize} from './game/settings/lights.js';
import { createVerticalGradientTexture, getRandomColorExcludingNavyBlue, rgbDistance} from './game/effects/backgroundColor.js'
import { createGround } from './game/objects/ground.js';

let physicsBodies = [];

document.body.appendChild(renderer.domElement);

initAudio();

let stack = [];
let blockSizeX = 10;
let blockSizeZ = 10;
const blockHeight = 2;
let currentPosition = 10;
let movingDirection = 1;
let speed = 0.10;
let currentHeight = 0;
let moveInX = false;
let score = 0;
const minTolerance = 0.04; // 5% minimum tolerance
const maxTolerance = 0.40; // 20% maximum tolerance

// USE FOR SPEEDUP FUNCTION
const base = 0.15;
const step = 0.002;
const breakpoint = 30;

let cameraState = 'gameplay'; // Can be 'gameplay', 'gameover', etc.
camera.position.set(15, 15, 15);
camera.lookAt(0, blockHeight, 0);

let isResetting = false;
let resetStartTime;
const resetDuration = 1000; // 1 second
const blockResetTimeout = 300;

let currentColor = getRandomColorExcludingNavyBlue();
let targetColor = getRandomColorExcludingNavyBlue();
let lerpFactor = 0.1;

scene.add(ambientLight);
scene.add(directionalLight);

// Add the base block
createBlock(0, 0, 0); 

//background setup
createGround();


setInterval(() => {
    createMovingCloudWithTexture('assets/cloud.png', "left", currentHeight);
}, 11000);

setInterval(() => {
    createMovingCloudWithTexture('assets/cloud2.png', "left", currentHeight); 
}, 7000);


export function resetGame() {
    isResetting = true;
    // Store current camera position and target
    const startPosition = camera.position.clone();
    const startTarget = new THREE.Vector3();
    camera.getWorldDirection(startTarget).normalize;
    startTarget.add(camera.position);

    const endPosition = new THREE.Vector3(15, 15, 15); // Reset position
    const endTarget = new THREE.Vector3(0, blockHeight, 0); // Reset look-at point

    const resetStartTime = Date.now();

    function animateReset() {
        if (!isResetting) return;

        const elapsedTime = Date.now() - resetStartTime;
        const progress = Math.min(elapsedTime / resetDuration, 1);

        // Use a smooth step function for easing
        const easedProgress = progress * progress * (3 - 2 * progress);

        // Interpolate camera position
        camera.position.lerpVectors(startPosition, endPosition, easedProgress);

        // Interpolate camera target
        const currentTarget = new THREE.Vector3();
        currentTarget.lerpVectors(startTarget, endTarget, easedProgress);
        camera.lookAt(currentTarget);

        if (progress < 1) {
            requestAnimationFrame(animateReset);
        } else {
            //isResetting = false;
            //setTimeout(completeReset, blockResetTimeout); // Wait until finished to reset blocks from scene + sleep for a bit
            
            // Sync camera state after reset
            const finalX = camera.position.x;
            const finalZ = camera.position.z;
            // Synchronize cameraAngle and targetAngle to prevent jitter
            cameraAngle = Math.atan2(finalZ, finalX);
            targetAngle = cameraAngle;
            // Perform reset operations
            setTimeout(() => {
                currentHeight = blockHeight; // Reinitialize to base block height
                completeReset(); // Clear the stack and reset the scene
                isResetting = false; // Resume user control
            }, blockResetTimeout);
            cameraState = 'gameplay';
            // completeReset(); 
        }
            
    }
    animateReset();
}

export function cleanupGame1() {
    // Dispose of the stack and materials
    stack.forEach(block => {
        if (block.geometry) block.geometry.dispose();
        if (block.material) block.material.dispose();
        scene.remove(block);
    });
    stack = [];
    

    physicsBodies.forEach(({ mesh, body }) => {
        if (mesh) {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            scene.remove(mesh);
        }
        if (body) {
            world.removeBody(body); // Remove the physics body from the physics world
        }
    });
    physicsBodies = [];

    // Dispose of lights and other objects
    scene.children.forEach(obj => {
        if (obj.type === 'Mesh' || obj.type === 'Light') {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
    });

    // Dispose of renderer
    if (renderer) {
        renderer.dispose();
    }

    while (world.bodies.length > 0) {
        world.removeBody(world.bodies[0]); // Remove all bodies from the physics world
    }

    console.log(physicsBodies)
    console.log(world)

}

function completeReset() {
    // remove all blocks from scene & physics world
    for (let i = stack.length - 1; i >= 0; i--) {
        scene.remove(stack[i]);
        stack.pop();
      }

    // remove all physics bodies and corresponding meshes
    for (let i = physicsBodies.length - 1; i >= 0; i--) {
        const { mesh, body } = physicsBodies[i];
        if (mesh) {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
        if (body) {
            world.removeBody(body);
        }
        physicsBodies.pop();
    }

    blockSizeX = 10;
    blockSizeZ = 10;
    currentPosition = 10;
    movingDirection = 1;
    currentHeight = 0;
    moveInX = false;
    score = 0;
    speed = 0.10;
    document.getElementById('score').innerText = `${score}`;

    currentColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    targetColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    lerpFactor = 0.1;

    // Clear existing lights
    scene.remove(scene.getObjectByName('ambientLight'));
    scene.remove(scene.getObjectByName('directionalLight'));
    // Make new lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(20, 40, 20);
    directionalLight.name = 'directionalLight';
    scene.add(directionalLight);

    // Add the base block
    createBlock(0, 0, 0); 
}

function createFallingBlock(x, y, z, fallBlockSizeX, fallBlockSizeZ) {
    const geometry = new THREE.BoxGeometry(fallBlockSizeX, blockHeight, fallBlockSizeZ);
    const prevBlockColor = stack[stack.length - 1].material.color;

    const material = new THREE.MeshPhongMaterial({ color: prevBlockColor });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);

    // Create the physics body
    const shape = new CANNON.Box(new CANNON.Vec3(fallBlockSizeX / 2, blockHeight / 2, fallBlockSizeZ / 2));
    const body = new CANNON.Body({
        mass: 1, // Dynamic body
        position: new CANNON.Vec3(x, y, z),
        shape: shape,
        material: new CANNON.Material({ restitution: 0.6 }) // Add bounciness
    });

    // Set initial velocity to simulate falling
    body.velocity.set(0, -5, 0);

    // Add to the physics world and sync list
    world.addBody(body);
    physicsBodies.push({ mesh: block, body: body });
}


function createBlock(x, y, z) {
    const geometry = new THREE.BoxGeometry(blockSizeX, blockHeight, blockSizeZ);
    // Interpolate current color toward the target color using lerp
    currentColor.lerp(targetColor, lerpFactor);

    let upperColor = '#000080';

    // Create the material with the updated current color
    let material = new THREE.MeshPhongMaterial({
        color: currentColor, // Directly use currentColor
        specular: 0x555555,
        shininess: 40
    });

    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    stack.push(block);

    // Update the background color to match the current block color
    // currentColor =  new THREE.Color(0, 0, 0);
    let gradientTexture = createVerticalGradientTexture(currentColor, upperColor);
    scene.background = gradientTexture.clone();
    const colorDifference = rgbDistance(currentColor,targetColor);

    // This threshold is the color difference of the prev color and current color
    const colorThreshold = 0.3; // Adjust this threshold as needed.
    if (colorDifference < colorThreshold) {
        targetColor = new THREE.Color(Math.random(), Math.random(), Math.random()); // New random color
    }
    
    const blockMaterial = new CANNON.Material('block');
    blockMaterial.friction = 0.5;
    blockMaterial.restitution = 0.001;
    // Add physics body for the block
    const shape = new CANNON.Box(new CANNON.Vec3(blockSizeX / 2, blockHeight / 2, blockSizeZ / 2));
    const body = new CANNON.Body({
        mass: stack.length === 1 ? 0 : 1, // Base block is static
        position: new CANNON.Vec3(x, y, z),
        shape: shape,
        material: blockMaterial
    });

    world.addBody(body);
    physicsBodies.push(body);
}


function addBlock() {
    const lastBlock = stack[stack.length - 1];
    createBlock(
        lastBlock.position.x,
        lastBlock.position.y + blockHeight,
        lastBlock.position.z
    );
    
    if (stack.length > 2) {

        currentHeight += blockHeight;
        // Adjust camera position and focus
        camera.position.y = currentHeight + 10;
        camera.lookAt(0, currentHeight, 0);
    } else {
        currentHeight += blockHeight; // fixes stutter jumping since start with a block on plane.
    }
    // Toggle direction for the next block
    moveInX = !moveInX;

    score++;
    //speed += 0.005;
    speed = calculateSpeed(score);
    document.getElementById('score').innerText = `${score}`;
}
function calculateSpeed(currentScore) {

    if (currentScore <= breakpoint) {
        return base + step * (2 * currentScore - (currentScore ** 2) / breakpoint);
    } else {
        return base + step * (breakpoint + 2 * Math.sqrt(currentScore - breakpoint));
    }
}
// Update block position and check alignment
function update() {
    if (stack.length > 1) {
        const currentBlock = stack[stack.length - 1];
        currentPosition += movingDirection * speed;

        // Move in x or z direction based on moveInX flag
        if (moveInX) {
            currentBlock.position.x = currentPosition;
        } else {
            currentBlock.position.z = currentPosition;
        }

        // Reverse direction when reaching boundary
        if (currentPosition > 15 || currentPosition < -15) {
            movingDirection *= -1;
        }
    }
}
// Handle user input to "stack" the block
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        const currentBlock = stack[stack.length - 1];
        const previousBlock = stack[stack.length - 2];
        
        // Check alignment with the previous block
        // If previousBlock is not null or undefined, it calculates the overlap by finding the difference between currentBlock and previousBlock positions.
        // If previousBlock is null or undefined (i.e., this is the first block), it returns 0, as there’s no overlap to calculate.
        const overlap = moveInX ? previousBlock ? currentBlock.position.x - previousBlock.position.x : 0
                                : previousBlock ? currentBlock.position.z - previousBlock.position.z : 0;

        const maxBlockSize = moveInX ? blockSizeX : blockSizeZ;
        const originalSize = 10; // original X and Z size (at beginning)
        const tolerancePercent = calculateTolerance(maxBlockSize, originalSize);
        let placedExact = false;
        if (Math.abs(overlap) <= maxBlockSize) {
            // if within 'closeenough' 
            
            if (Math.abs(overlap) > 0) {
                if ((Math.abs(overlap)/maxBlockSize <= tolerancePercent) && (previousBlock)) {
                    if (moveInX) {
                        currentBlock.position.x = previousBlock.position.x;
                      } else { // if moves in Z
                        currentBlock.position.z = previousBlock.position.z;
                      }
                      createRippleEffect(currentBlock.position.x, currentBlock.position.z, currentHeight, blockSizeX, blockSizeZ);
                      placedExact = true;
                } else {
                    let fallBlockSizeX = blockSizeX; // Grab before chop-off value for X
                    let fallBlockSizeZ = blockSizeZ; // Grab before chop-off value for Y

                    if (moveInX) {
                        blockSizeX -= Math.abs(overlap);
                        fallBlockSizeX = maxBlockSize - blockSizeX;
                    } else {
                        blockSizeZ -= Math.abs(overlap);
                        fallBlockSizeZ= maxBlockSize - blockSizeZ;
                    }

                    scene.remove(currentBlock);
                    let geometry = new THREE.BoxGeometry(blockSizeX, blockHeight, blockSizeZ);
                    let newBlock = new THREE.Mesh(geometry, currentBlock.material);

                    if (moveInX) {
                        newBlock.position.set(
                            previousBlock.position.x + (currentBlock.position.x - previousBlock.position.x) / 2,
                            currentBlock.position.y,
                            currentBlock.position.z
                        );
                    } else {
                        newBlock.position.set(
                            currentBlock.position.x,
                            currentBlock.position.y,
                            previousBlock.position.z + (currentBlock.position.z - previousBlock.position.z) / 2
                        );
                    }
                  
                    scene.add(newBlock);
                    stack[stack.length - 1] = newBlock; // Update current block in stack
                    
                    // calculate falling block position based on overlap
                    if (moveInX){
                        const fallingBlockX = overlap > 0 
                        ? newBlock.position.x + blockSizeX / 2 + Math.abs(overlap) / 2 
                        : newBlock.position.x - blockSizeX / 2 - Math.abs(overlap) / 2;
                        createFallingBlock(fallingBlockX, newBlock.position.y, newBlock.position.z, fallBlockSizeX, fallBlockSizeZ);
                    } else {
                        const fallingBlockZ = overlap > 0 
                        ? newBlock.position.z + blockSizeZ / 2 + Math.abs(overlap) / 2 
                        : newBlock.position.z - blockSizeZ / 2 - Math.abs(overlap) / 2;

                        createFallingBlock(newBlock.position.x, newBlock.position.y, fallingBlockZ, fallBlockSizeX, fallBlockSizeZ);
                    }
                    newBlock.castShadow = true;
                    newBlock.receiveShadow = true;
                }
                
                
            }
            if (stack.length > 1) { // Ignore base block
                if (placedExact) {
                    playPerfectSound();
                } else {
                    playPlaceSound(); 
                }
            }
            addBlock(); // Add new block if aligned
            currentPosition = -15; // Reset position for next block
        } else {
            cameraState = 'gameover';
            // Save the initial camera position and the target final position
            const initialCameraPosition = camera.position.clone();
            const initialLookAt = camera.getWorldDirection(new THREE.Vector3()).add(camera.position);
            
            // Calculate the final camera position and look-at target
            const towerHeight = currentHeight + blockHeight;
            const targetCameraPosition = new THREE.Vector3(0, towerHeight / 2, towerHeight * 2);  
            const targetLookAt = new THREE.Vector3(0, towerHeight / 1.5, 0);  

            // Start the camera transition animation
            let transitionStartTime = Date.now();
            const transitionDuration = 1500;

            function animateCameraTransition() {
                const elapsedTime = Date.now() - transitionStartTime;
                const progress = Math.min(elapsedTime / transitionDuration, 1);
                const easedProgress = progress * progress * (3 - 2 * progress);
              
                const towerHeight = currentHeight + blockHeight;
                const targetPosition = new THREE.Vector3(0, towerHeight / 2, towerHeight * 1.5);
                const targetLookAt = new THREE.Vector3(0, towerHeight / 2, 0);
              
                camera.position.lerpVectors(initialCameraPosition, targetPosition, easedProgress);
                camera.lookAt(new THREE.Vector3().lerpVectors(initialLookAt, targetLookAt, easedProgress));
                camera.updateProjectionMatrix();
              
                if (progress < 1) {
                  requestAnimationFrame(animateCameraTransition);
                } else {
                  setTimeout(() => {
                    showGameOver();
                  }, 500);
                }
              }

            animateCameraTransition(); // Start the animation
        }
    }
});
function calculateTolerance(currentSize, originalSize) {
    // const minTolerance = 0.05; // 5% minimum tolerance
    // const maxTolerance = 0.40; // 20% maximum tolerance
    const sizeFactor = currentSize / originalSize;
    
    // Exponential increase in tolerance as size decreases
    const tolerance = minTolerance + (maxTolerance - minTolerance) * Math.pow(1 - sizeFactor, 3);
    
    return Math.min(maxTolerance, Math.max(minTolerance, tolerance));
}


let cameraAngle = Math.PI / 4; // Initial angle (45 degrees)
const cameraRadius = 20; // Fixed radius for the circular path
const cameraSpeed = 0.05; // Speed of rotation
let targetAngle = cameraAngle;

window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowRight') {
        // Rotate counter-clockwise
        targetAngle -= cameraSpeed;
    } else if (event.code === 'ArrowLeft') {
        // Rotate clockwise
        targetAngle += cameraSpeed;
    }
});

function animateCamera() {
    if (cameraState === 'gameplay' && !isResetting) {
        // Gradually interpolate the angle
        cameraAngle += (targetAngle - cameraAngle) * 0.1;
        // Update the camera's position
        const cameraX = cameraRadius * Math.cos(cameraAngle);
        const cameraZ = cameraRadius * Math.sin(cameraAngle);
        camera.position.set(cameraX, currentHeight + 15, cameraZ);
        camera.lookAt(0, currentHeight, 0);
    }
    requestAnimationFrame(animateCamera);
}
// const cannonDebugger = new CannonDebugger(scene, world);
animateCamera();
animate();


function animate() {
    requestAnimationFrame(animate);

    world.step(1 / 60);

    physicsBodies.forEach(item => {
        if (item && item.mesh && item.body) {
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);
        }
    });
    // cannonDebugger.update();
    update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});