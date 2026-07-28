import * as THREE from 'three';

export class LightsManager {
    constructor() {
        this.lights = [];
    }
    
    init(scene) {
        // Lumière ambiante
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambient);
        this.lights.push(ambient);
        
        // Lumière principale
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(1, 1, 1);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        scene.add(keyLight);
        this.lights.push(keyLight);
        
        // Lumière de remplissage
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.8);
        fillLight.position.set(-0.5, 0, -0.5);
        scene.add(fillLight);
        this.lights.push(fillLight);
        
        // Lumière d'accentuation
        const rimLight = new THREE.DirectionalLight(0xff8888, 0.6);
        rimLight.position.set(0, -0.5, -0.2);
        scene.add(rimLight);
        this.lights.push(rimLight);
    }
    
    dispose(scene) {
        this.lights.forEach(light => scene.remove(light));
        this.lights = [];
    }
}
