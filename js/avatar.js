import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BlendshapeMapper } from './blendshapeMapper.js';

export class AvatarManager {
    constructor() {
        this.model = null;
        this.blendshapeMapper = new BlendshapeMapper();
        this.headBone = null;
        this.leftEyeBone = null;
        this.rightEyeBone = null;
        this.mixer = null;
        
        this.currentBlendshapes = new Map();
        this.targetBlendshapes = new Map();
        this.headRotation = { x: 0, y: 0, z: 0 };
        this.targetHeadRotation = { x: 0, y: 0, z: 0 };
    }
    
    async loadModel(path, scene) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            
            loader.load(
                path,
                (gltf) => {
                    this.model = gltf.scene;
                    this.mixer = new THREE.AnimationMixer(this.model);
                    
                    // Analyse des morph targets
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetDictionary) {
                            this.blendshapeMapper.addMeshBlendshapes(child);
                        }
                        
                        if (child.isBone) {
                            const name = child.name.toLowerCase();
                            if (name.includes('head') && !name.includes('eye')) {
                                this.headBone = child;
                            } else if (name.includes('lefteye') || name.includes('eye_l')) {
                                this.leftEyeBone = child;
                            } else if (name.includes('righteye') || name.includes('eye_r')) {
                                this.rightEyeBone = child;
                            }
                        }
                    });
                    
                    // Initialiser les valeurs actuelles
                    this.blendshapeMapper.getAllBlendshapeNames().forEach(name => {
                        this.currentBlendshapes.set(name, 0);
                        this.targetBlendshapes.set(name, 0);
                    });
                    
                    // Centrer le modèle
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    this.model.position.sub(center);
                    // Ajuster l'échelle si nécessaire (optionnel)
                    // const size = box.getSize(new THREE.Vector3()).length();
                    // if (size > 0.5) this.model.scale.setScalar(0.5 / size);
                    
                    scene.add(this.model);
                    console.log(this.model);
                    console.log("Nombre d'enfants :", this.model.children.length)            
                    console.log(`✅ Modèle chargé: ${this.blendshapeMapper.getBlendshapeCount()} blendshapes`);
                    const box = new THREE.Box3().setFromObject(this.model);
                    const size = box.getSize(new THREE.Vector3());

                    console.log("Largeur :", size.x);
                    console.log("Hauteur :", size.y);
                    console.log("Profondeur :", size.z);.   
                    resolve(this.model);
                },
                (progress) => {
                    if (progress.total > 0) {
                        console.log(`Chargement modèle: ${Math.round(progress.loaded/progress.total*100)}%`);
                    }
                },
                (error) => {
                    console.error('❌ Erreur chargement modèle:', error);
                    reject(error);
                }
            );
        });
    }
    
    updateBlendshapes(mediapipeBlendshapes) {
        for (const [category, value] of Object.entries(mediapipeBlendshapes)) {
            this.targetBlendshapes.set(category, value);
        }
    }
    
    updateHeadRotation(rotation) {
        this.targetHeadRotation = rotation;
    }
    
    update(deltaTime) {
        if (!this.model) return;
        
        const lerpFactor = Math.min(0.3, deltaTime * 8); // dépendant du framerate pour fluidité
        
        // Interpolation des blendshapes
        this.blendshapeMapper.getAllBlendshapeNames().forEach(name => {
            const current = this.currentBlendshapes.get(name) || 0;
            const target = this.targetBlendshapes.get(name) || 0;
            const smoothed = current + (target - current) * lerpFactor;
            
            this.currentBlendshapes.set(name, smoothed);
            this.blendshapeMapper.setBlendshapeValue(name, smoothed);
        });
        
        // Rotation de la tête
        const rotLerp = 0.3;
        this.headRotation.x += (this.targetHeadRotation.x - this.headRotation.x) * rotLerp;
        this.headRotation.y += (this.targetHeadRotation.y - this.headRotation.y) * rotLerp;
        this.headRotation.z += (this.targetHeadRotation.z - this.headRotation.z) * rotLerp;
        
        if (this.headBone) {
            this.headBone.rotation.set(
                this.headRotation.x,
                this.headRotation.y,
                this.headRotation.z
            );
        } else {
            // fallback sur le mesh racine
            const root = this.model;
            root.rotation.set(this.headRotation.x, this.headRotation.y, this.headRotation.z);
        }
        
        // Yeux
        if (this.leftEyeBone) {
            this.leftEyeBone.rotation.y = this.headRotation.y * 0.5;
            this.leftEyeBone.rotation.x = this.headRotation.x * 0.5;
        }
        if (this.rightEyeBone) {
            this.rightEyeBone.rotation.y = this.headRotation.y * 0.5;
            this.rightEyeBone.rotation.x = this.headRotation.x * 0.5;
        }
        
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
    
    dispose(scene) {
        if (this.model) {
            scene.remove(this.model);
            this.model.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}
