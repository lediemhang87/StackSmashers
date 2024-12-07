import * as THREE from 'three';
import scene from '../settings/scene';
export function createRippleEffect(x, z, currentHeight, blockSizeX, blockSizeZ) {
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
