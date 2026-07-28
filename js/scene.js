import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = null;
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 1, 5);
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
}
