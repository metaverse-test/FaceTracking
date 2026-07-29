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
            0.01,   // near plus petit pour éviter de couper le modèle
            10
        );
        // Position par défaut (sera écrasée par fitToModel)
        this.camera.position.set(0, 0.1, 0.5);
        this.camera.lookAt(0, 0, 0);
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    enableOrbitControls(domElement) {
        this.controls = new OrbitControls(this.camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.15;
        this.controls.maxDistance = 1.5;
        this.controls.target.set(0, 0.05, 0);
        this.controls.update();
    }
    
    // Ajuste la caméra pour voir tout le modèle
    fitToModel(model) {
        if (!model) return;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        
        // Placer la caméra à une distance raisonnable
        const dist = size * 1.5;
        this.camera.position.copy(center).add(new THREE.Vector3(0, 0.05, dist));
        this.camera.lookAt(center);
        
        // Mettre à jour la cible d'OrbitControls
        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }
    
    get() {
        return this.camera;
    }
    
    updateControls() {
        if (this.controls) {
            this.controls.update();
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
