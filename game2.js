import * as THREE from 'three';
import { showGameOver } from './index.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(20, 20, 20);
camera.lookAt(0, 5, 0);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let stack = [];
let blockSizeX = 10;
let blockSizeY = 10;
const blockHeight = 4;
let currentPosition = 10;
let movingDirection = 1;
const speed = 0.2;
let currentHeight = 0;

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Add the base block
//createBlock(0, 0, 0); 

//createCustomBlock("T", 0, 0, 0);
//createCustomBlock("L", 0, 0, 0);
createCustomBlock("Line", 0, 0, 0);


function createCustomBlock(type, x, y, z) {
    const group = new THREE.Group();

    const blockGeometry = new THREE.BoxGeometry(blockHeight, blockHeight, blockHeight); // Each small block
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });

    const addCube = (gx, gy, gz) => {
        const cube = new THREE.Mesh(blockGeometry, material);
        cube.position.set(gx, gy, gz);
        group.add(cube);
    };

    switch (type) {
        case "T":
            addCube(0, 0, 0);  // Center
            addCube(-4, 0, 0); // Left
            addCube(4, 0, 0);  // Right
            addCube(0, 4, 0);  // Top
            break;
        case "L":
            addCube(0, 0, 0);  // Base
            addCube(0, 4, 0);  // Middle
            addCube(0, 8, 0);  // Top
            addCube(4, 0, 0);  // Bottom side
            break;
        case "Line":
            addCube(0, 0, 0);
            addCube(0, 4, 0);
            addCube(0, 8, 0);
            addCube(0, 12, 0);
            break;
        default:
            console.error("Unknown block type");
    }

    group.position.set(x, y, z);
    scene.add(group);
    stack.push(group);
}

function addBlock() {
    const lastBlock = stack[stack.length - 1];
    const types = ["T", "L", "Line"];
    const randomType = types[Math.floor(Math.random() * types.length)]; // Pick a random block type
    
    // Calculate the highest point in the stack
    let maxHeight = 0;
    stack.forEach(blockGroup => {
        blockGroup.children.forEach(block => {
            maxHeight = Math.max(maxHeight, block.position.y + blockGroup.position.y);
        });
    });
    
    const newHeight = maxHeight + blockHeight;

    createCustomBlock(
        randomType,
        0,
        newHeight,
        0
    );
    // createBlock(
    //     lastBlock.position.x,
    //     lastBlock.position.y + blockHeight,
    //     lastBlock.position.z
    // );

    currentHeight = maxHeight;
    adjustCameraPosition();
}

function adjustCameraPosition() {
    // Target camera height: slightly above the current tallest block
    const targetHeight = currentHeight + 10;

    // Smooth transition to the target height
    const speed = 0.05; // Adjust speed for smoother/slower movement
    camera.position.y += (targetHeight - camera.position.y) * speed;

    // Update the camera's look-at point
    camera.lookAt(0, currentHeight, 0);
}


// Update block position and check alignment
function update() {
    if (stack.length > 1) {
        const currentBlock = stack[stack.length - 1];

        if (currentBlock instanceof THREE.Group) {
            currentPosition += movingDirection * speed;
            currentBlock.position.x = currentPosition;

            if (currentPosition >= 25 || currentPosition <= -25) {
                // Reverse direction when reaching boundary
                movingDirection *= -1; 
            }
        }


        
    }
}

// Handle user input to "stack" the block
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        const currentBlock = stack[stack.length - 1];
        const previousBlock = stack[stack.length - 2];

        // Check alignment with the previous block
        const overlap = previousBlock ? currentBlock.position.x - previousBlock.position.x : 0;
        

        if (Math.abs(overlap) <= blockSizeX) {

            addBlock(); // Add new block if aligned
            checkBalance();   
            currentPosition = -15; // Reset position for next block
            

        } else {
            console.log("Game Over!");
            showGameOver();
        }
    }
});

function checkBalance() {
    let totalX = 0;
    let totalY = 0;
    let totalZ = 0;

    // Sum the x, y, z positions of all blocks
    stack.forEach(block => {
        totalX += block.position.x;
        totalY += block.position.y;
        totalZ += block.position.z;
    });

    // Calculate the center of mass
    const centerX = totalX / stack.length;
    const centerY = totalY / stack.length;
    const centerZ = totalZ / stack.length;

    // Set a threshold based on how far the center of mass can deviate from (0, 0, 0)
    const threshold = blockSizeX / 2;  // Half the size of a block for some tolerance

    // Check if the center of mass has shifted too far from the base
    if (Math.abs(centerX) > threshold || Math.abs(centerZ) > threshold) {
        console.log("Stack Unbalanced! Game Over!");
        showGameOver();
    }
}


animate();

function animate() {
    requestAnimationFrame(animate);
    update();
    adjustCameraPosition();
    renderer.render(scene, camera);
}



window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

