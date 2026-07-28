export class AnimationManager {
    constructor() {
        this.animations = [];
        this.clock = null;
    }
    
    init() {
        // Gestionnaire d'animation simplifié
        // Peut être étendu pour gérer des animations GLTF
    }
    
    /**
     * Interpolation linéaire
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * Smooth step pour des transitions plus douces
     */
    static smoothStep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Easing in-out
     */
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    dispose() {
        this.animations = [];
    }
}
