import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Gravity pointing down
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

export default world;