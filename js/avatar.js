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
        
        // Valeurs actuelles pour l'interpolation
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
                    
                    // Analyser et mapper les blendshapes
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetDictionary) {
                            this.blendshapeMapper.addMeshBlendshapes(child);
                        }
                        
                        // Détecter les os
                        if (child.isBone) {
                            const name = child.name.toLowerCase();
                            if (name.includes('head')) {
                                this.headBone = child;
                            } else if (name.includes('lefteye') || name.includes('eye_l')) {
                                this.leftEyeBone = child;
                            } else if (name.includes('righteye') || name.includes('eye_r')) {
                                this.rightEyeBone = child;
                            }
                        }
                    });
                    
                    // Initialiser les blendshapes actuels
                    this.blendshapeMapper.getAllBlendshapeNames().forEach(name => {
                        this.currentBlendshapes.set(name, 0);
                        this.targetBlendshapes.set(name, 0);
                    });
                    
                    // Centrer le modèle
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    this.model.position.sub(center);
                    
                    scene.add(this.model);
                    
                    console.log(`✅ Modèle chargé: ${this.blendshapeMapper.getBlendshapeCount()} blendshapes détectés`);
                    resolve(this.model);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    console.log(`Chargement: ${percent}%`);
                },
                (error) => {
                    console.error('❌ Erreur de chargement du modèle:', error);
                    reject(error);
                }
            );
        });
    }
    
    updateBlendshapes(mediapipeBlendshapes) {
        // Mettre à jour les cibles
        for (const [category, value] of Object.entries(mediapipeBlendshapes)) {
            this.targetBlendshapes.set(category, value);
        }
    }
    
    updateHeadRotation(rotation) {
        this.targetHeadRotation = rotation;
    }
    
    update(deltaTime) {
        if (!this.model) return;
        
        // Interpolation des blendshapes (lerp)
        const lerpFactor = 0.3; // Facteur de lissage
        
        this.blendshapeMapper.getAllBlendshapeNames().forEach(name => {
            const current = this.currentBlendshapes.get(name) || 0;
            const target = this.targetBlendshapes.get(name) || 0;
            const smoothed = current + (target - current) * lerpFactor;
            
            this.currentBlendshapes.set(name, smoothed);
            this.blendshapeMapper.setBlendshapeValue(name, smoothed);
        });
        
        // Interpolation de la rotation de la tête
        if (this.headBone) {
            const smoothFactor = 0.3;
            
            this.headRotation.x += (this.targetHeadRotation.x - this.headRotation.x) * smoothFactor;
            this.headRotation.y += (this.targetHeadRotation.y - this.headRotation.y) * smoothFactor;
            this.headRotation.z += (this.targetHeadRotation.z - this.headRotation.z) * smoothFactor;
            
            this.headBone.rotation.set(
                this.headRotation.x,
                this.headRotation.y,
                this.headRotation.z
            );
        } else {
            // Rotation du mesh principal si pas de bone
            const mainMesh = this.model.children[0];
            if (mainMesh) {
                mainMesh.rotation.y += (this.targetHeadRotation.y - mainMesh.rotation.y) * 0.3;
                mainMesh.rotation.x += (this.targetHeadRotation.x - mainMesh.rotation.x) * 0.3;
                mainMesh.rotation.z += (this.targetHeadRotation.z - mainMesh.rotation.z) * 0.3;
            }
        }
        
        // Animation des yeux
        if (this.leftEyeBone) {
            this.leftEyeBone.rotation.y += (this.targetHeadRotation.y * 0.5 - this.leftEyeBone.rotation.y) * 0.2;
            this.leftEyeBone.rotation.x += (this.targetHeadRotation.x * 0.5 - this.leftEyeBone.rotation.x) * 0.2;
        }
        
        if (this.rightEyeBone) {
            this.rightEyeBone.rotation.y += (this.targetHeadRotation.y * 0.5 - this.rightEyeBone.rotation.y) * 0.2;
            this.rightEyeBone.rotation.x += (this.targetHeadRotation.x * 0.5 - this.rightEyeBone.rotation.x) * 0.2;
        }
        
        // Mettre à jour le mixer d'animation
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
    
    dispose(scene) {
        if (this.model) {
            scene.remove(this.model);
            // Libérer les ressources
            this.model.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
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
