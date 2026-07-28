export class UIManager {
    constructor() {
        this.elements = {
            modelName: document.getElementById('modelName'),
            blendshapeCount: document.getElementById('blendshapeCount'),
            mediapipeStatus: document.getElementById('mediapipeStatus'),
            cameraStatus: document.getElementById('cameraStatus'),
            fps: document.getElementById('fps')
        };
    }
    
    updateModelName(name) {
        this.elements.modelName.textContent = name;
    }
    
    updateBlendshapeCount(count) {
        this.elements.blendshapeCount.textContent = count;
    }
    
    updateMediaPipeStatus(active) {
        const el = this.elements.mediapipeStatus;
        el.textContent = active ? 'Actif' : 'Inactif';
        el.className = `value ${active ? 'status-active' : 'status-inactive'}`;
    }
    
    updateCameraStatus(active) {
        const el = this.elements.cameraStatus;
        el.textContent = active ? 'Active' : 'Inactive';
        el.className = `value ${active ? 'status-active' : 'status-inactive'}`;
    }
    
    updateFPS(fps) {
        this.elements.fps.textContent = fps;
    }
    
    showError(message) {
        console.error(message);
        // Ajouter une notification visuelle si nécessaire
    }
}

/**
 * Détecte les fonctionnalités WebGL disponibles
 */
export function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
        throw new Error('WebGL non supporté');
    }
    
    console.log('✅ WebGL supporté');
    console.log('   Version:', gl.getParameter(gl.VERSION));
    console.log('   Renderer:', gl.getParameter(gl.RENDERER));
    
    return true;
}

/**
 * Vérifie la compatibilité MediaPipe
 */
export function checkMediaPipeSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API MediaDevices non supportée');
    }
    
    console.log('✅ MediaDevices supporté');
    return true;
}
