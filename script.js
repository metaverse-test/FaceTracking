// Point d'entrée principal
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
        
        this.isRunning = false;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        
        this.init();
    }
    
    async init() {
        try {
            // Initialiser Three.js
            this.renderer.init(document.getElementById('output'));
            this.scene.init();
            this.camera.init();
            this.lights.init(this.scene.get());
            
            // Charger l'avatar
            const modelPath = './assets/models/LuciaHead.glb';
            await this.avatar.loadModel(modelPath, this.scene.get());
            
            // Mettre à jour l'UI
            const blendshapeCount = this.avatar.blendshapeMapper.getBlendshapeCount();
            this.ui.updateModelName('LuciaHead.glb');
            this.ui.updateBlendshapeCount(blendshapeCount);
            
            // Initialiser MediaPipe
            await this.mediapipe.init();
            this.ui.updateMediaPipeStatus(true);
            
            // Configurer les contrôles
            this.setupControls();
            
            // Démarrer la boucle de rendu
            this.animate();
            
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            this.ui.showError('Erreur lors du chargement');
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
            } catch (error) {
                console.error('Erreur caméra:', error);
            }
        });
        
        stopBtn.addEventListener('click', () => {
            this.mediapipe.stopCamera();
            this.ui.updateCameraStatus(false);
            startBtn.disabled = false;
            stopBtn.disabled = true;
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Calculer les FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            this.ui.updateFPS(this.fps);
        }
        
        // Mettre à jour l'animation faciale
        if (this.mediapipe.isTracking()) {
            const blendshapes = this.mediapipe.getBlendshapes();
            const headRotation = this.mediapipe.getHeadRotation();
            
            if (blendshapes) {
                this.avatar.updateBlendshapes(blendshapes);
            }
            
            if (headRotation) {
                this.avatar.updateHeadRotation(headRotation);
            }
        }
        
        // Mettre à jour les animations
        this.avatar.update(this.clock?.getDelta() || 0.016);
        
        // Rendu
        this.renderer.render(this.scene.get(), this.camera.get());
    }
}

// Démarrer l'application
const app = new App();
