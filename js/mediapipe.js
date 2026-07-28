import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';

export class MediaPipeManager {
    constructor() {
        this.faceLandmarker = null;
        this.video = null;
        this.stream = null;
        this.isTracking = false;
        this.lastVideoTime = -1;
        
        // Derniers résultats
        this.latestBlendshapes = null;
        this.latestHeadRotation = null;
    }
    
    async init() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            );
            
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU'
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: 'VIDEO',
                numFaces: 1
            });
            
            console.log('✅ MediaPipe Face Landmarker initialisé');
            return true;
        } catch (error) {
            console.error('❌ Erreur MediaPipe:', error);
            throw error;
        }
    }
    
    async startCamera() {
        try {
            this.video = document.getElementById('webcam');
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            this.isTracking = true;
            this.track();
            
            console.log('✅ Caméra démarrée');
        } catch (error) {
            console.error('❌ Erreur caméra:', error);
            throw error;
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.isTracking = false;
        this.latestBlendshapes = null;
        this.latestHeadRotation = null;
        
        console.log('⏹️ Caméra arrêtée');
    }
    
    async track() {
        if (!this.isTracking || !this.faceLandmarker || !this.video) {
            return;
        }
        
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            
            try {
                const results = this.faceLandmarker.detectForVideo(this.video, performance.now());
                
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    // Convertir les blendshapes en objet simple
                    const blendshapes = {};
                    results.faceBlendshapes[0].forEach(blendshape => {
                        blendshapes[blendshape.categoryName] = blendshape.score;
                    });
                    
                    this.latestBlendshapes = blendshapes;
                }
                
                // Extraire la rotation de la tête
                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const matrix = results.facialTransformationMatrixes[0].data;
                    this.latestHeadRotation = this.extractRotation(matrix);
                }
                
            } catch (error) {
                console.warn('Erreur de tracking:', error);
            }
        }
        
        // Continuer le tracking
        requestAnimationFrame(() => this.track());
    }
    
    extractRotation(matrix) {
        // Extraire les angles d'Euler de la matrice de transformation
        // matrix est un tableau de 16 éléments (4x4)
        
        const rotation = {
            x: Math.atan2(matrix[6], matrix[10]),
            y: Math.atan2(-matrix[2], Math.sqrt(matrix[6] * matrix[6] + matrix[10] * matrix[10])),
            z: Math.atan2(matrix[1], matrix[0])
        };
        
        // Limiter la rotation
        rotation.x = Math.max(-0.5, Math.min(0.5, rotation.x));
        rotation.y = Math.max(-0.8, Math.min(0.8, rotation.y));
        rotation.z = Math.max(-0.3, Math.min(0.3, rotation.z));
        
        return rotation;
    }
    
    getBlendshapes() {
        return this.latestBlendshapes;
    }
    
    getHeadRotation() {
        return this.latestHeadRotation;
    }
    
    isActive() {
        return this.isTracking;
    }
    
    dispose() {
        this.stopCamera();
        
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }
    }
}
