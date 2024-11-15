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
let blockSizeY = 10;
const blockHeight = 2;
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
createBlock(0, 0, 0); 

function createFallingBlock(x, y, z, fallBlockSizeX) {
    const geometry = new THREE.BoxGeometry(fallBlockSizeX, blockHeight, blockSizeY);
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
    const geometry = new THREE.BoxGeometry(blockSizeX, blockHeight, blockSizeY);
    let blockColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    let material = new THREE.MeshPhongMaterial({
        // Base color of the block
        color: blockColor,       
        ambient: 0.0,
        diffusivity: 0.5,
        specularity: 1.0,
        smoothness: 40.0
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);
    scene.background = blockColor;
    stack.push(block);
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
    camera.lookAt(-20, currentHeight-20, -30);
}

// Update block position and check alignment
function update() {
    if (stack.length > 1) {
        const currentBlock = stack[stack.length - 1];
        currentPosition += movingDirection * speed;
        let check = (stack.length - 1) % 2; 
        if (check === 0){
            currentBlock.position.x = currentPosition;
        }else{
            currentBlock.position.z = currentPosition;
        }
        
        if (currentPosition > 15 || currentPosition < -15) {
            // Reverse direction when reaching boundary
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
        const overlap = previousBlock ? currentBlock.position.x - previousBlock.position.x : 0;
        

        if (Math.abs(overlap) <= blockSizeX) {
            if (Math.abs(overlap) > 0){
                let fallBlockSizeX = blockSizeX; // Grab before chop-off value
                blockSizeX -= Math.abs(overlap);
                fallBlockSizeX -= blockSizeX; // New final fallBlockSizeX

                scene.remove(currentBlock); 
                let geometry = new THREE.BoxGeometry(blockSizeX, blockHeight, blockSizeY);
                let newBlock = new THREE.Mesh(geometry, currentBlock.material);

                newBlock.position.set(
                    previousBlock.position.x + (currentBlock.position.x - previousBlock.position.x)/2,
                    currentBlock.position.y,
                    currentBlock.position.z
                );
                scene.add(newBlock);
                stack[stack.length - 1].position.x =  previousBlock.position.x + (currentBlock.position.x - previousBlock.position.x)/2
                
                // calculate X length of falling block, (can be pos or neg)
                const fallingBlockX = overlap > 0 ? newBlock.position.x + blockSizeX/2 + Math.abs(overlap)/2 : newBlock.position.x - blockSizeX/2 - Math.abs(overlap)/2
                createFallingBlock(fallingBlockX, newBlock.position.y, newBlock.position.z, fallBlockSizeX);
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

