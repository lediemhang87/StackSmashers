import * as THREE from 'three';
import scene from './scene';
import renderer from './renderer';
const d = 30;
export const frustumSize = 30;

export const ambientLight = new THREE.AmbientLight(0x404040, 1);
ambientLight.name = 'ambientLight';


export const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.name = 'directionalLight';
directionalLight.position.set(20, 40, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -5*d;
directionalLight.shadow.camera.right = 5*d;
directionalLight.shadow.camera.top = 5*d;
directionalLight.shadow.camera.bottom = -5*d;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.radius = 4;

// export const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
// scene.add(hemisphereLight);
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
directionalLight.castShadow = true;
directionalLight.shadow.normalBias = 0.02;
directionalLight.shadow.bias = -0.001;
const aspect = window.innerWidth / window.innerHeight;

export const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
  );