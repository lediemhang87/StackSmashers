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


function createBlock(x, y, z) {
    const geometry = new THREE.BoxGeometry(blockSizeX, blockHeight, blockSizeY);
 
    let material = new THREE.MeshPhongMaterial({
        // Base color of the block
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),       
        ambient: 0.0,
        diffusivity: 0.5,
        specularity: 1.0,
        smoothness: 40.0
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);
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
        currentBlock.position.x = currentPosition;

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
                blockSizeX -= Math.abs(overlap);
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

