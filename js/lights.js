import * as THREE from 'three';

export class LightsManager {
    constructor() {
        this.lights = [];
    }
    
    init(scene) {
        // Ambiante douce
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        this.lights.push(ambient);
        
        // Lumière principale (key light)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(0.5, 0.8, 0.7);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.01;
        keyLight.shadow.camera.far = 5;
        scene.add(keyLight);
        this.lights.push(keyLight);
        
        // Remplissage (fill)
        const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6);
        fillLight.position.set(-0.5, 0.2, -0.4);
        scene.add(fillLight);
        this.lights.push(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffccaa, 0.5);
        rimLight.position.set(0, -0.3, -0.5);
        scene.add(rimLight);
        this.lights.push(rimLight);
    }
    
    dispose(scene) {
        this.lights.forEach(light => scene.remove(light));
        this.lights = [];
    }
}
