import * as THREE from 'three';
import { showGameOver } from './index.js';


import * as CANNON from 'cannon-es';



const world = new CANNON.World();

world.gravity.set(0, -9.82, 0); // Gravity pointing down

world.broadphase = new CANNON.NaiveBroadphase();

world.solver.iterations = 10;

let physicsBodies = [];

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


camera.position.set(15, 15, 15);
camera.lookAt(0, 5, 0);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let stack = [];
let blockSizeX = 10;
let blockSizeZ = 10;
const blockHeight = 2;
let currentPosition = 10;
let movingDirection = 1;
const speed = 0.25;
let currentHeight = 0;
let moveInX = false;
const fallSpeed = 0.1; // May change to gravitational velocity function
let score = 0;

let isResetting = false;
let resetStartTime;
const resetDuration = 1000; // 1 second
const blockResetTimeout = 300;

let currentColor = new THREE.Color(Math.random(), Math.random(), Math.random());
let targetColor = new THREE.Color(Math.random(), Math.random(), Math.random());
let lerpFactor = 0.1;
const ambientLight = new THREE.AmbientLight(0x404040, 1);
ambientLight.name = 'ambientLight';
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.name = 'directionalLight';
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Add the base block
createBlock(0, 0, 0); 

function createGround() {

    // Create PlaneGeometry with subdivisions for vertex manipulation

    const groundWidth = 50;
    const groundHeight = 50;
    const widthSegments = 50; // Increase for more detailed bumps
    const heightSegments = 50;
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
        roughness: 0.1,
        metalness: 0,
    });

    // Create a mesh for the ground
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
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

    const startY = Math.random() * (30 - 0) + 0 + currentHeight; // max 30 + height, min is height

    const startZ = 10; // Random depth

    cloud.position.set(startX, startY, startZ);



    // Set cloud size

    const cloudSize = Math.random() * 10 + 10; // Random size

    cloud.scale.set(cloudSize, cloudSize, 1);



    // Add the cloud to the scene

    scene.add(cloud);



    // Set cloud speed

    const cloudSpeed = Math.random() * 0.5 + 0.2; // Random speed



    // Animate the cloud

    function animateCloud() {

        // cloud.position.x += startDirection === "left" ? cloudSpeed : -cloudSpeed;

        // cloud.position.y -= cloudSpeed/4; 



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



// game1.js

export function resetGame() {
    // Store current camera position and target
    const startPosition = camera.position.clone();
    const startTarget = new THREE.Vector3();
    camera.getWorldDirection(startTarget);
    startTarget.add(camera.position);

    // Set up the camera transition
    const endPosition = new THREE.Vector3(15, 15, 15);
    const endTarget = new THREE.Vector3(0, 5, 0);
 
    // Start the reset animation
    isResetting = true;
    resetStartTime = Date.now();

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
            isResetting = false;
            setTimeout(completeReset, blockResetTimeout); // Wait until finished to reset blocks from scene + sleep for a bit
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
    directionalLight.position.set(5, 10, 5);
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

    // Create the material with the updated current color
    let material = new THREE.MeshPhongMaterial({
        color: currentColor, // Directly use currentColor
        specular: 0x555555,
        shininess: 40
    });

    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);
    stack.push(block);


    // Update the background color to match the current block color
    scene.background = currentColor.clone();

    const colorDifference = rgbDistance(currentColor,targetColor);

    // This threshold is the color difference of the prev color and current color
    const colorThreshold = 0.3; // Adjust this threshold as needed.

    if (colorDifference < colorThreshold) {
        targetColor = new THREE.Color(Math.random(), Math.random(), Math.random()); // New random color
    }
    
    // Add physics body for the block
    const shape = new CANNON.Box(new CANNON.Vec3(blockSizeX / 2, blockHeight / 2, blockSizeZ / 2));
    const body = new CANNON.Body({
        mass: stack.length === 1 ? 0 : 1, // Base block is static
        position: new CANNON.Vec3(x, y, z),
        shape: shape,
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

    currentHeight += blockHeight;
    camera.position.y = currentHeight + 8;
    camera.lookAt(-20, currentHeight - 7, -20);

    // Toggle direction for the next block
    moveInX = !moveInX;

    score++;
    document.getElementById('score').innerText = `${score}`;
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

        if (Math.abs(overlap) <= maxBlockSize) {
            if (Math.abs(overlap) > 0) {
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
            }

            addBlock(); // Add new block if aligned
            currentPosition = -15; // Reset position for next block
        } else {
            console.log("Game Over!");
            showGameOver();
        }
    }
});

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

    update();
    renderer.render(scene, camera);
    
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});