export class BlendshapeMapper {
    constructor() {
        // Map: nom du blendshape -> { mesh, index }
        this.blendshapeMap = new Map();
        this.meshes = [];
    }
    
    /**
     * Analyse un mesh et enregistre ses morph targets
     */
    addMeshBlendshapes(mesh) {
        if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
            console.warn('⚠️ Mesh sans morph targets:', mesh.name);
            return;
        }
        
        const dictionary = mesh.morphTargetDictionary;
        const count = Object.keys(dictionary).length;
        
        console.log(`📊 Mesh "${mesh.name}": ${count} morph targets détectés`);
        
        // Enregistrer chaque blendshape
        for (const [name, index] of Object.entries(dictionary)) {
            this.blendshapeMap.set(name, {
                mesh: mesh,
                index: index
            });
        }
        
        // Garder une référence au mesh
        this.meshes.push(mesh);
        
        // Initialiser les influences à 0
        if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences.fill(0);
        }
    }
    
    /**
     * Applique une valeur à un blendshape spécifique
     */
    setBlendshapeValue(name, value) {
        const mapping = this.blendshapeMap.get(name);
        
        if (!mapping) {
            // Ignorer silencieusement les blendshapes non trouvés
            return false;
        }
        
        // Clamper la valeur entre 0 et 1
        const clampedValue = Math.max(0, Math.min(1, value));
        
        // Appliquer la valeur
        mapping.mesh.morphTargetInfluences[mapping.index] = clampedValue;
        
        return true;
    }
    
    /**
     * Applique plusieurs blendshapes à la fois
     */
    updateBlendshapes(blendshapes) {
        // Réinitialiser toutes les influences à 0
        this.meshes.forEach(mesh => {
            mesh.morphTargetInfluences.fill(0);
        });
        
        // Appliquer chaque blendshape
        for (const [name, value] of Object.entries(blendshapes)) {
            this.setBlendshapeValue(name, value);
        }
    }
    
    /**
     * Vérifie si un blendshape existe
     */
    hasBlendshape(name) {
        return this.blendshapeMap.has(name);
    }
    
    /**
     * Retourne tous les noms de blendshapes disponibles
     */
    getAllBlendshapeNames() {
        return Array.from(this.blendshapeMap.keys());
    }
    
    /**
     * Retourne le nombre total de blendshapes uniques
     */
    getBlendshapeCount() {
        return this.blendshapeMap.size;
    }
    
    /**
     * Affiche un résumé des blendshapes détectés
     */
    logSummary() {
        console.log('📋 Résumé des blendshapes:');
        console.log(`   Total: ${this.blendshapeMap.size} blendshapes`);
        
        const arKitBlendshapes = [
            'eyeBlinkLeft', 'eyeBlinkRight', 'jawOpen', 'mouthSmileLeft',
            'mouthSmileRight', 'browDownLeft', 'browDownRight', 'mouthFrownLeft',
            'mouthFrownRight'
        ];
        
        const found = arKitBlendshapes.filter(name => this.blendshapeMap.has(name));
        const missing = arKitBlendshapes.filter(name => !this.blendshapeMap.has(name));
        
        console.log(`   ARKit trouvés: ${found.join(', ')}`);
        
        if (missing.length > 0) {
            console.warn(`   ARKit manquants: ${missing.join(', ')}`);
        }
    }
}
