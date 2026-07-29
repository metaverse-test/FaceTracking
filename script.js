import * as THREE from 'three';
import { SceneManager } from './js/scene.js';
import { CameraManager } from './js/camera.js';
import { RendererManager } from './js/renderer.js';
import { LightsManager } from './js/lights.js';
import { AvatarManager } from './js/avatar.js';
import { MediaPipeManager } from './js/mediapipe.js';
import { AnimationManager } from './js/animation.js';
import { UIManager } from './js/utils.js';

class App {
    constructor() {
        this.scene = new SceneManager();
        this.camera = new CameraManager();
        this.renderer = new RendererManager();
        this.lights = new LightsManager();
        this.avatar = new AvatarManager();
        this.mediapipe = new MediaPipeManager();
        this.animation = new AnimationManager();
        this.ui = new UIManager();
        
        this.clock = new THREE.Clock();   // ← AJOUT : Clock pour le delta time
        this.isRunning = false;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Initialisation...');
            
            // Vérifications WebGL et MediaPipe
            checkWebGLSupport();
            checkMediaPipeSupport();
            
            // Initialiser Three.js
            this.renderer.init(document.getElementById('output'));
            console.log('✅ Renderer créé');
            
            this.scene.init();
            console.log('✅ Scène créée');
            
            this.camera.init();
            console.log('✅ Caméra initialisée');
            
            // Ajouter les lumières
            this.lights.init(this.scene.get());
            console.log('💡 Lumières ajoutées');
            
            // Ajouter grille et sol pour vérifier la scène
            this.scene.addGridAndGround();
            console.log('📏 Grille et sol ajoutés');
            
            // Activer OrbitControls (après renderer)
            this.camera.enableOrbitControls(this.renderer.getDomElement());
            console.log('🖱️ OrbitControls activés');
            
            // Charger l'avatar
            const modelPath = './assets/models/LuciaHead.glb';
            await this.avatar.loadModel(modelPath, this.scene.get());
            console.log('👤 Modèle chargé');
            
            // Ajuster la caméra en fonction du modèle
            this.camera.fitToModel(this.avatar.model);
            console.log('📷 Caméra ajustée');
            
            // Mise à jour UI
            const blendshapeCount = this.avatar.blendshapeMapper.getBlendshapeCount();
            this.ui.updateModelName('LuciaHead.glb');
            this.ui.updateBlendshapeCount(blendshapeCount);
            console.log(`📊 ${blendshapeCount} blendshapes détectés`);
            
            // Initialiser MediaPipe
            await this.mediapipe.init();
            this.ui.updateMediaPipeStatus(true);
            console.log('🧠 MediaPipe prêt');
            
            // Configurer les contrôles utilisateur
            this.setupControls();
            
            // Démarrer la boucle de rendu
            this.animate();
            console.log('🎬 Boucle d’animation démarrée');
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            this.ui.showError('Erreur lors du chargement : ' + error.message);
        }
    }
    
    setupControls() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        startBtn.addEventListener('click', async () => {
            try {
                await this.mediapipe.startCamera();
                this.ui.updateCameraStatus(true);
                startBtn.disabled = true;
                stopBtn.disabled = false;
                console.log('📹 Caméra activée');
            } catch (error) {
                console.error('Erreur caméra:', error);
                alert('Impossible d’accéder à la caméra.');
            }
        });
        
        stopBtn.addEventListener('click', () => {
            this.mediapipe.stopCamera();
            this.ui.updateCameraStatus(false);
            startBtn.disabled = false;
            stopBtn.disabled = true;
            console.log('⏹️ Caméra désactivée');
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        try {
            const delta = this.clock.getDelta();   // ← utilisation du clock
            
            // Mise à jour des contrôles
            this.camera.updateControls();
            
            // Calcul des FPS
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = now;
                this.ui.updateFPS(this.fps);
            }
            
            // Animation faciale
            if (this.mediapipe.isActive()) {   // ← correction : isActive() au lieu de isTracking()
                const blendshapes = this.mediapipe.getBlendshapes();
                const headRotation = this.mediapipe.getHeadRotation();
                
                if (blendshapes) {
                    this.avatar.updateBlendshapes(blendshapes);
                }
                
                if (headRotation) {
                    this.avatar.updateHeadRotation(headRotation);
                }
            }
            
            // Mise à jour de l'avatar (interpolation)
            this.avatar.update(delta);
            
            // Rendu
            this.renderer.render(this.scene.get(), this.camera.get());
            
        } catch (e) {
            console.error('Erreur dans la boucle d’animation :', e);
        }
    }
}

// Fonctions de vérification déplacées dans utils.js (ou ici)
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
        throw new Error('WebGL non supporté par ce navigateur.');
    }
    console.log('🌐 WebGL OK');
}

function checkMediaPipeSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API MediaDevices non disponible.');
    }
    console.log('📡 MediaDevices OK');
}

// Démarrer l'application
const app = new App();
