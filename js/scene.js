import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = null;
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        // Pas de fog pour bien voir la scène
    }
    
    get() {
        return this.scene;
    }
    
    add(object) {
        this.scene.add(object);
    }
    
    remove(object) {
        this.scene.remove(object);
    }
    
    // Nouvelle méthode pour ajouter les aides visuelles
    addGridAndGround() {
        // Grille
        const grid = new THREE.GridHelper(1, 20, 0x444466, 0x222233);
        grid.position.y = -0.3;
        this.scene.add(grid);
        
        // Sol simple
        const groundGeometry = new THREE.PlaneGeometry(2, 2);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x333355,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.3;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Axes (optionnel, plus discret)
        const axes = new THREE.AxesHelper(0.3);
        axes.position.y = -0.3;
        this.scene.add(axes);
    }
}
