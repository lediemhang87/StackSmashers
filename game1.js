import * as THREE from 'three';
import { showGameOver } from './index.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(10, 10, 10);
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
const speed = 0.6;
let currentHeight = 0;
let moveInX = false;


let currentColor = new THREE.Color(Math.random(), Math.random(), Math.random());
let targetColor = new THREE.Color(Math.random(), Math.random(), Math.random());
let lerpFactor = 0.1;
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Add the base block
createBlock(0, 0, 0); 

function createFallingBlock(x, y, z, fallBlockSizeX, fallBlockSizeZ) {
    const geometry = new THREE.BoxGeometry(fallBlockSizeX, blockHeight, fallBlockSizeZ);
    const prevBlockColor = stack[stack.length - 1].material.color;

    let material = new THREE.MeshPhongMaterial({
        // Base color of the block
        color: prevBlockColor,       
        ambient: 0.0,
        diffusivity: 0.5,
        specularity: 1.0,
        smoothness: 40.0
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);

    const fallSpeed = 0.1; // May change to gravitational velocity function
    
    function animateFall() {
        block.position.y -= fallSpeed;
        if (block.position.y > (currentHeight - 15)) {  // Adjust this value based on where you want the block to disappear
            requestAnimationFrame(animateFall);
        } else {
            scene.remove(block);
        }
    }
    animateFall();
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

    const colorThreshold = 0.3; // Adjust this threshold as needed

    if (colorDifference < colorThreshold) {
        targetColor = new THREE.Color(Math.random(), Math.random(), Math.random()); // New random color
    }
    
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
    camera.position.y = currentHeight + 10;
    camera.lookAt(-20, currentHeight - 20, -30);

    

    // Toggle direction for the next block
    moveInX = !moveInX;
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
    update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

