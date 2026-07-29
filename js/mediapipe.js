import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';

export class MediaPipeManager {
    constructor() {
        this.faceLandmarker = null;
        this.video = null;
        this.stream = null;
        this.isTracking = false;
        this.lastVideoTime = -1;
        this.isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
                        ('ontouchstart' in window && window.innerWidth < 1024);
        this.latestBlendshapes = null;
        this.latestHeadRotation = null;
    }
    
    async init() {
        try {
            const delegate = this.isMobile ? 'CPU' : 'GPU';
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            );
            
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: delegate
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: 'VIDEO',
                numFaces: 1
            });
            console.log(`✅ MediaPipe initialisé (${delegate})`);
            return true;
        } catch (error) {
            console.error('❌ Erreur MediaPipe:', error);
            throw error;
        }
    }
    
    async startCamera() {
        try {
            this.video = document.getElementById('webcam');
            const constraints = this.getCameraConstraints();
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            this.video.setAttribute('playsinline', '');
            this.video.setAttribute('webkit-playsinline', '');
            this.video.muted = true;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    console.log(`📐 Résolution caméra: ${this.video.videoWidth}x${this.video.videoHeight}`);
                    resolve();
                };
            });
            
            await this.video.play().catch(async (error) => {
                if (error.name === 'NotAllowedError') {
                    console.warn('⚠️ Autoplay bloqué, attente interaction');
                    await new Promise(resolve => {
                        document.addEventListener('click', () => {
                            this.video.play().then(resolve);
                        }, { once: true });
                    });
                } else {
                    throw error;
                }
            });
            
            this.isTracking = true;
            this.track();
            console.log('✅ Caméra démarrée');
        } catch (error) {
            console.error('❌ Erreur caméra:', error);
            throw error;
        }
    }
    
    getCameraConstraints() {
        if (this.isMobile) {
            return {
                video: {
                    facingMode: { ideal: 'user' },
                    width: { ideal: 320, max: 640 },
                    height: { ideal: 240, max: 480 },
                    frameRate: { ideal: 15, max: 30 }
                }
            };
        } else {
            return {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 30, max: 60 }
                }
            };
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
        
        if (this.video.paused || this.video.ended || !this.video.srcObject) {
            requestAnimationFrame(() => this.track());
            return;
        }
        
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            
            try {
                const results = this.faceLandmarker.detectForVideo(this.video, performance.now());
                
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const blendshapes = {};
                    results.faceBlendshapes[0].forEach(bs => {
                        blendshapes[bs.categoryName] = bs.score;
                    });
                    this.latestBlendshapes = blendshapes;
                }
                
                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const matrix = results.facialTransformationMatrixes[0].data;
                    this.latestHeadRotation = this.extractRotation(matrix);
                }
                
            } catch (error) {
                // Ignorer les erreurs de lecture vidéo temporaires
                if (!error.message?.includes('Video is not ready')) {
                    console.warn('Erreur tracking:', error);
                }
            }
        }
        
        requestAnimationFrame(() => this.track());
    }
    
    extractRotation(matrix) {
        const rotation = {
            x: Math.atan2(matrix[6], matrix[10]),
            y: Math.atan2(-matrix[2], Math.sqrt(matrix[6] * matrix[6] + matrix[10] * matrix[10])),
            z: Math.atan2(matrix[1], matrix[0])
        };
        
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
