import * as THREE from 'three';
import { showGameOver } from './index.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Gravity pointing down
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;
let physicsBodies = [];
const scene = new THREE.Scene();
//const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 30;
const camera = new THREE.OrthographicCamera(
  frustumSize * aspect / -2,
  frustumSize * aspect / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

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
const ambientLight = new THREE.AmbientLight(0x404040, 1);
ambientLight.name = 'ambientLight';
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.name = 'directionalLight';
directionalLight.position.set(20, 40, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
const d = 30;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -5*d;
directionalLight.shadow.camera.right = 5*d;
directionalLight.shadow.camera.top = 5*d;
directionalLight.shadow.camera.bottom = -5*d;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.radius = 4;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
scene.add(hemisphereLight);
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
directionalLight.castShadow = true;
directionalLight.shadow.normalBias = 0.02;
directionalLight.shadow.bias = -0.001;
// Add the base block
createBlock(0, 0, 0); 

let audioContext;
let placeSound;
export function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    fetch('assets/plomp.mp3')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        placeSound = audioBuffer;
    });
    
    fetch('assets/wood-place.mp3') // zap-woosh vs. zap-crash vs click (wavs) VS wood-place.mp3
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        perfectSound = audioBuffer;
    });
}
let perfectSound;
function playPlaceSound() {
    if (placeSound && audioContext) {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = placeSound;
        gainNode.gain.value = 0.1; // Adjust this value to control volume (0 to 1)
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
      }
  }
function playPerfectSound() {
    if (perfectSound && audioContext) {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        source.buffer = perfectSound;
        source.playbackRate.value = 2;
        gainNode.gain.value = 0.7; // Adjust this value to control volume (0 to 1)
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
    }
}

//background setup
function createVerticalGradientTexture(baseColor, upperColor) {
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
function getRandomColorExcludingNavyBlue() {
    let color;
    do {
        // Generate a random color
        color = new THREE.Color(Math.random(), Math.random(), Math.random());
    } while (isCloseToNavyBlue(color));  // Keep trying until it's not navy blue
    return color;
}
function isCloseToNavyBlue(color) {
    // Navy blue is approximately rgb(0, 0, 128) or #000080
    const navyBlue = new THREE.Color(0, 0, 128);
    return rgbDistance(color, navyBlue) < 0.1; // Threshold for "closeness"
}


function createGround() {

    // Create PlaneGeometry with subdivisions for vertex manipulation

    const groundWidth = 50;
    const groundHeight = 50;
    const widthSegments = 500; // Increase for more detailed bumps
    const heightSegments = 500;
    const groundGeometry = new THREE.PlaneGeometry(groundWidth, groundHeight, widthSegments, heightSegments);

    // Manipulate vertices to create bumps
    const positionAttribute = groundGeometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = (Math.random() * 2 - 1)/3;
        positionAttribute.setZ(i, z);

    }

    groundGeometry.computeVertexNormals(); // Recalculate normals for proper shading

    // Create a material for the ground
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x557d5c, // A greenish color
        roughness: 1,
        metalness: 0,
    });

    // Create a mesh for the ground
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
    ground.receiveShadow = true; // Enable shadow receiving
    scene.add(ground);

    // Create the physics representation as a flat plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
        mass: 0, // Static body
        shape: groundShape,
    });

    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to match Three.js
    world.addBody(groundBody);
}

createGround();

function createMovingCloudWithTexture(texturePath, startDirection = "left") {

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

    const cloudSize = Math.random() * 10 + 10; // Random size

    cloud.scale.set(cloudSize, cloudSize, 1);
    // Add the cloud to the scene
    scene.add(cloud);
    // Set cloud speed
    const cloudSpeed = Math.random() * speed + 0.05; // Random speed (0.05 to avoid freezing)

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

setInterval(() => {
    createMovingCloudWithTexture('assets/cloud.png', "left");
}, 11000);

setInterval(() => {
    createMovingCloudWithTexture('assets/cloud2.png', "left"); // Replace with your PNG path
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
        shininess: 40,
        roughness: 0.7
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

function rgbDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
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

function createRippleEffect(x, z, currentHeight, blockSizeX, blockSizeZ) {
    const edgeThickness = 0.1;
    const rippleDuration = 500; // milliseconds
    const maxRippleSize = 0.4; // Maximum expansion size
  
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
  
    // Create outer square
    const outerGeometry = new THREE.BoxGeometry(blockSizeX + edgeThickness * 2, edgeThickness, blockSizeZ + edgeThickness * 2);
    const outerEdge = new THREE.Mesh(outerGeometry, rippleMaterial.clone());
    outerEdge.position.set(x, currentHeight + edgeThickness / 2, z);
    scene.add(outerEdge);
  
    // Create inner square
    const innerGeometry = new THREE.BoxGeometry(blockSizeX - edgeThickness * 2, edgeThickness, blockSizeZ - edgeThickness * 2);
    const innerEdge = new THREE.Mesh(innerGeometry, rippleMaterial.clone());
    innerEdge.position.set(x, currentHeight + edgeThickness / 2, z);
    scene.add(innerEdge);
  
    const startTime = Date.now();
  
    function animateRipple() {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / rippleDuration, 1);
      const size = 1 + progress * maxRippleSize;
  
      // Scale and fade outer square
      outerEdge.scale.set(size, 1, size);
      outerEdge.material.opacity = 0.8 * (1 - progress);
  
      // Scale and fade inner square
      innerEdge.scale.set(size, 1, size);
      innerEdge.material.opacity = 0.8 * (1 - progress);
  
      if (progress < 1) {
        requestAnimationFrame(animateRipple);
      } else {
        scene.remove(outerEdge);
        scene.remove(innerEdge);
        outerEdge.geometry.dispose();
        outerEdge.material.dispose();
        innerEdge.geometry.dispose();
        innerEdge.material.dispose();
      }
    }
  
    animateRipple();
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
const cannonDebugger = new CannonDebugger(scene, world);
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
    cannonDebugger.update();
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