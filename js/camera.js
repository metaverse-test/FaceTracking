import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraManager {
    constructor() {
        this.camera = null;
        this.controls = null;
    }
    
    init() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            10
        );
        
        this.camera.position.set(0, 0, 0.5);
        this.camera.lookAt(0, 0, 0);
        
        // Configuration responsive
        window.addEventListener('resize', () => this.onResize());
    }
    
    enableOrbitControls(renderer) {
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.2;
        this.controls.maxDistance = 2;
    }
    
    get() {
        return this.camera;
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
