import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';

export class MediaPipeManager {
    constructor() {
        this.faceLandmarker = null;
        this.video = null;
        this.stream = null;
        this.isTracking = false;
        this.lastVideoTime = -1;
        this.isMobile = this.detectMobile();
        
        // Derniers résultats
        this.latestBlendshapes = null;
        this.latestHeadRotation = null;
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || 
               ('ontouchstart' in window && window.innerWidth < 1024);
    }
    
    async init() {
        try {
            // Utiliser le bon backend selon l'appareil
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
            console.log(`📱 Mobile: ${this.isMobile}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur MediaPipe:', error);
            throw error;
        }
    }
    
    async startCamera() {
        try {
            this.video = document.getElementById('webcam');
            
            // Configuration adaptative pour mobile
            const constraints = this.getCameraConstraints();
            
            console.log('📹 Contraintes caméra:', constraints);
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Gestion de l'orientation sur mobile
            this.setupOrientationHandler();
            
            // Attendre que la vidéo soit prête
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    console.log(`📐 Résolution: ${this.video.videoWidth}x${this.video.videoHeight}`);
                    resolve();
                };
            });
            
            // Lecture avec gestion des restrictions mobiles
            await this.video.play().catch(async (error) => {
                if (error.name === 'NotAllowedError') {
                    console.warn('⚠️ Autoplay bloqué, attente interaction utilisateur');
                    // Réessayer après un clic
                    await new Promise(resolve => {
                        document.addEventListener('click', () => {
                            this.video.play().then(resolve);
                        }, { once: true });
                    });
                } else {
                    throw error;
                }
            });
            
            // Ajuster le style pour mobile
            this.setupVideoDisplay();
            
            this.isTracking = true;
            this.track();
            
            console.log('✅ Caméra démarrée');
        } catch (error) {
            console.error('❌ Erreur caméra:', error);
            this.handleCameraError(error);
            throw error;
        }
    }
    
    getCameraConstraints() {
        if (this.isMobile) {
            // Sur mobile : caméra frontale, résolution modérée
            return {
                video: {
                    facingMode: 'user',
                    width: { ideal: 320, max: 640 },
                    height: { ideal: 240, max: 480 },
                    frameRate: { ideal: 15, max: 30 }
                }
            };
        } else {
            // Sur desktop : meilleure résolution
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
    
    setupOrientationHandler() {
        // Gérer les changements d'orientation sur mobile
        const handleOrientation = () => {
            if (this.video && this.video.srcObject) {
                // Ajuster l'affichage selon l'orientation
                this.setupVideoDisplay();
            }
        };
        
        // Écouter les changements d'orientation
        window.addEventListener('orientationchange', handleOrientation);
        window.addEventListener('resize', handleOrientation);
        
        // Stocker pour le nettoyage
        this._orientationHandler = handleOrientation;
    }
    
    setupVideoDisplay() {
        if (!this.video) return;
        
        // Sur mobile, on cache la vidéo mais on la garde active
        this.video.style.display = 'none';
        
        // S'assurer que la vidéo est en cours de lecture
        if (this.video.paused) {
            this.video.play().catch(() => {});
        }
        
        // Appliquer un style qui préserve le ratio
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'cover';
        
        // Sur mobile, s'assurer que la vidéo n'est pas en pause
        if (this.isMobile) {
            this.video.setAttribute('playsinline', '');
            this.video.setAttribute('webkit-playsinline', '');
            this.video.muted = true; // Important pour autoplay sur mobile
        }
    }
    
    handleCameraError(error) {
        let message = 'Erreur caméra inconnue';
        
        switch (error.name) {
            case 'NotAllowedError':
                message = 'Accès à la caméra refusé. Veuillez autoriser la caméra dans les paramètres.';
                break;
            case 'NotFoundError':
                message = 'Aucune caméra trouvée sur cet appareil.';
                break;
            case 'NotReadableError':
                message = 'La caméra est déjà utilisée par une autre application.';
                break;
            case 'OverconstrainedError':
                message = 'Les contraintes de caméra ne peuvent pas être satisfaites.';
                break;
            case 'TypeError':
                message = 'Connexion non sécurisée. Utilisez HTTPS pour accéder à la caméra.';
                break;
        }
        
        console.error('❌', message);
        alert(message);
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        // Nettoyer les écouteurs d'orientation
        if (this._orientationHandler) {
            window.removeEventListener('orientationchange', this._orientationHandler);
            window.removeEventListener('resize', this._orientationHandler);
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
        
        // Vérifier que la vidéo est en cours de lecture
        if (this.video.paused || this.video.ended || !this.video.srcObject) {
            requestAnimationFrame(() => this.track());
            return;
        }
        
        // Éviter de traiter la même frame
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            
            try {
                // Sur mobile, réduire la charge en sautant des frames
                if (this.isMobile && Math.random() > 0.5) {
                    requestAnimationFrame(() => this.track());
                    return;
                }
                
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
                // Ignorer les erreurs de tracking occasionnelles
                if (error.message !== 'Video is not ready') {
                    console.warn('Erreur de tracking:', error);
                }
            }
        }
        
        // Continuer le tracking avec un délai adapté au mobile
        if (this.isMobile) {
            setTimeout(() => requestAnimationFrame(() => this.track()), 16);
        } else {
            requestAnimationFrame(() => this.track());
        }
    }
    
    extractRotation(matrix) {
        // Extraire les angles d'Euler de la matrice de transformation
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
