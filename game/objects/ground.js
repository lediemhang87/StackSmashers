import * as THREE from 'three';
import scene from '../settings/scene';
import world from '../settings/world';
import * as CANNON from 'cannon-es';

export function createGround() {
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
