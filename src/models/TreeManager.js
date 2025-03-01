// models/TreeManager.js
import { Tree } from './classes';
import { Utils } from '../utils/helpers';

/**
 * TreeManager handles all tree lifecycle operations including:
 * - Initialization and planting
 * - Growth and aging
 * - Reproduction
 * - Death (stress, age, concurrence)
 * - Tracking consumption by deer
 */
class TreeManager {
    constructor(gridSize) {
        this.trees = Array(gridSize).fill(null).map(() => new Tree(0, 0, 0, 0, 0));
        this.grid = Utils.createGrid(gridSize);
        this.gridSize = gridSize;
        this.isStabilizing = true;
        
        // Death tracking
        this.consumedByDeer = 0;
        this.initializationDeaths = 0;
        this.simulationDeaths = 0;
        this.stressDeaths = 0;
        this.ageDeaths = 0;
        this.concurrenceDeaths = 0;
    }

    /**
     * Calculate tree properties based on age
     * @param {Tree} tree - The tree to calculate properties for
     * @returns {Tree} - New tree with calculated properties
     */
    calculateTreeProperties(tree) {
        if (!tree || !(tree instanceof Tree)) return null;
        
        // Create a new Tree instance with calculated properties
        const newTree = new Tree(
            tree.position,
            tree.age,
            0,  // height will be calculated
            0,  // diameter will be calculated
            0   // mass will be calculated
        );
        
        // Calculate based on forestry growth models
        newTree.diameter = 0.01 * tree.age;
        newTree.height = 1.3 + Math.pow((newTree.diameter / (1.95 + 0.13 * newTree.diameter)), 2.0);
        newTree.mass = 0.18 * Math.pow(100 * newTree.diameter, 2.7133);
        
        return newTree;
    }

    /**
     * Find an empty position in the tree array
     * @returns {number} - Index of empty position or -1 if none available
     */
    findEmptyPosition() {
        const emptyPositions = this.trees
            .map((tree, index) => !tree || tree.position === 0 ? index : -1)
            .filter(index => index !== -1);
        
        if (emptyPositions.length === 0) return -1;
        return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    }

    /**
     * Initial planting of trees
     * @param {number} limit - Number of trees to plant
     * @param {number} ageAvg - Average age of trees
     * @param {number} ageSigma - Standard deviation of tree ages
     */
    initialPlanting(limit, ageAvg, ageSigma) {
        console.log(`BAUM: Initial planting of ${limit} trees with avg age ${ageAvg}±${ageSigma}...`);
        
        let planted = 0;
        for (let i = 0; i < limit; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("BAUM: No more space available for planting");
                break;
            }

            const age = Math.max(1, Math.floor(Utils.randGauss(ageAvg, ageSigma)));
            const tempTree = new Tree(newPos + 1, age, 0, 0, 0);
            const calculatedTree = this.calculateTreeProperties(tempTree);
            
            if (calculatedTree) {
                this.trees[newPos] = calculatedTree;
                planted++;
            }
        }
        
        this.initializationDeaths = this.gridSize - planted;
        console.log(`BAUM: Successfully planted ${planted}/${limit} trees (${this.initializationDeaths} positions remain empty)`);
    }

    /**
     * Process tree concurrence (density-based deaths)
     * @param {number} density - Density factor (1-20 scale)
     */
    processConcurrence(density) {
        // Apply density scaling - higher value means MORE trees allowed per area
        // In the 1-20 scale, 1 means very sparse forest, 20 means very dense
        const scaledDensity = Math.max(1, Math.min(20, density));
        const maxTreesPerGrid = scaledDensity;
        const gridRange = 4;
        
        const { sideLength } = this.grid;
        let deathCount = 0;

        for (let y = gridRange; y < sideLength - gridRange; y++) {
            for (let x = gridRange; x < sideLength - gridRange; x++) {
                const localTrees = [];

                // Gather trees in local area
                for (let dy = -gridRange; dy <= gridRange; dy++) {
                    for (let dx = -gridRange; dx <= gridRange; dx++) {
                        const index = this.grid.getIndex(x + dx, y + dy);
                        if (index >= 0 && index < this.trees.length && 
                            this.trees[index] && this.trees[index].position !== 0) {
                            localTrees.push(this.trees[index]);
                        }
                    }
                }

                // If area is overcrowded, remove smallest trees
                if (localTrees.length > maxTreesPerGrid) {
                    // Sort by diameter (smaller trees die first)
                    localTrees.sort((a, b) => a.diameter - b.diameter);
                    
                    // Remove excess trees (smallest first)
                    for (let i = 0; i < localTrees.length - maxTreesPerGrid; i++) {
                        if (localTrees[i] && localTrees[i].position) {
                            this.removeTree(localTrees[i].position - 1, 'concurrence');
                            deathCount++;
                        }
                    }
                }
            }
        }

        if (deathCount > 0 && !this.isStabilizing) {
            console.log(`BAUM: ${deathCount} trees died from concurrence competition (density level: ${density})`);
        }
    }

    /**
     * Grow all trees by one year
     */
    grow() {
        let youngTreesBefore = this.trees.filter(tree => tree && tree.position !== 0 && tree.age <= 2).length;
        
        // Grow each living tree
        this.trees = this.trees.map(tree => {
            if (!tree || tree.position === 0) return tree;
            
            // Create a new Tree instance with increased age
            const grownTree = new Tree(
                tree.position,
                tree.age + 1,
                0, // Will calculate
                0, // Will calculate
                0  // Will calculate
            );
            
            // Calculate new dimensions based on updated age
            grownTree.diameter = 0.01 * grownTree.age;
            grownTree.height = 1.3 + Math.pow((grownTree.diameter / (1.95 + 0.13 * grownTree.diameter)), 2.0);
            grownTree.mass = 0.18 * Math.pow(100 * grownTree.diameter, 2.7133);
            
            return grownTree;
        });
        
        let youngTreesAfter = this.trees.filter(tree => tree && tree.position !== 0 && tree.age <= 2).length;
        
        if (!this.isStabilizing) {
            const aliveTrees = this.getPopulationCount();
            console.log(`BAUM: Trees grew by 1 year. Population: ${aliveTrees}, Young trees: ${youngTreesAfter}`);
        }
    }

    /**
     * Process deaths due to environmental stress
     * @param {number} stressParam - Stress level (1-10 scale)
     */
    processStressDeaths(stressParam) {
        // Normalize stress parameter to a 1-10 scale
        let stressLevel = Number(stressParam);
        let stressProbability;
        
        if (stressLevel > 10) {
            // Legacy compatibility: convert old stressIndex (higher = less stress, e.g. 85)
            stressLevel = Math.min(10, Math.max(1, Math.round(100 / stressLevel)));
            stressProbability = stressLevel / 100; 
        } else {
            // New stress level format (1-10 scale, higher = more stress)
            stressLevel = Math.min(10, Math.max(1, stressLevel));
            
            // Apply non-linear scaling for more impact at higher levels
            // Level 1 = 0.005 (0.5%), Level 5 = 0.05 (5%), Level 10 = 0.2 (20%)
            stressProbability = Math.pow(stressLevel / 10, 1.5) * 0.2;
        }
        
        let deathCount = 0;
        this.trees.forEach((tree, index) => {
            if (tree && tree.position !== 0) {
                // Older trees are more resistant to stress
                const ageResistance = Math.min(0.8, tree.age / 100); // Max 80% resistance
                const effectiveStressProbability = stressProbability * (1 - ageResistance);
                
                if (Math.random() < effectiveStressProbability) {
                    this.removeTree(index, 'stress');
                    deathCount++;
                }
            }
        });
        
        if (!this.isStabilizing || deathCount > 0) {
            console.log(`BAUM: ${deathCount} trees died from environmental stress (level ${stressLevel})`);
        }
        
        this.stressDeaths += deathCount;
    }

    /**
     * Process deaths due to old age
     */
    processAgeDeaths() {
        let deathCount = 0;
        
        this.trees.forEach((tree, index) => {
            if (tree && tree.position !== 0) {
                // Tree lifespan follows normal distribution
                const deathAge = Utils.randGauss(100, 10); // Mean 100 years, SD 10 years
                
                if (tree.age > deathAge) {
                    if (!this.isStabilizing) {
                        console.log(`BAUM: Tree at position ${index} died of old age (${tree.age.toFixed(1)} years)`);
                    }
                    this.removeTree(index, 'age');
                    deathCount++;
                }
            }
        });
        
        if (deathCount > 0 && !this.isStabilizing) {
            console.log(`BAUM: ${deathCount} trees died of old age`);
        }
        
        this.ageDeaths += deathCount;
    }

    /**
     * Remove a tree at the specified index
     * @param {number} index - Index of tree to remove
     * @param {string} cause - Cause of death for tracking
     */
    removeTree(index, cause = 'unknown') {
        if (index >= 0 && index < this.trees.length && this.trees[index].position !== 0) {
            this.trees[index] = new Tree(0, 0, 0, 0, 0);
            this.simulationDeaths++;
            
            // Track specific causes of death
            if (cause === 'stress') {
                this.stressDeaths++;
            } else if (cause === 'age') {
                this.ageDeaths++;
            } else if (cause === 'concurrence') {
                this.concurrenceDeaths++;
            }
        }
    }

    /**
     * Mark a tree as consumed by deer
     * @param {number} index - Index of tree consumed
     */
    markAsConsumedByDeer(index) {
        if (index >= 0 && index < this.trees.length && this.trees[index].position !== 0) {
            // Store age and position for logging
            const age = this.trees[index].age;
            const position = this.trees[index].position;
            
            // Clear the tree
            this.trees[index] = new Tree(0, 0, 0, 0, 0);
            this.consumedByDeer++;
            
            if (!this.isStabilizing) {
                console.log(`BAUM: Tree at position ${position} (age: ${age.toFixed(1)}) was consumed by deer`);
            }
        }
    }

    /**
     * Reproduce trees based on maturity and reproduction factor
     * @param {number} maturityAge - Age at which trees can reproduce
     * @param {number} reproductionFactor - Factor affecting reproduction rate (1-10 scale)
     */
    reproduce(maturityAge, reproductionFactor = 5.0) {
        // Scale reproduction factor (1-10) with non-linear impact
        // Low values (1-3) should have minimal effect, high values (8-10) should be powerful
        const scaledReproFactor = Math.pow(reproductionFactor / 5.0, 1.8);
        
        // Count mature trees that can reproduce
        const matureTrees = this.trees.filter(tree => tree && tree.position !== 0 && tree.age >= maturityAge).length;
        
        // Calculate forest density for reproduction limitation
        const totalTreeCount = this.getPopulationCount();
        const forestDensity = totalTreeCount / this.gridSize;
        
        // Adjust density factor - lower reproduction in dense forests
        // At 10% capacity: 0.9 factor, at 50% capacity: 0.5 factor, at 90% capacity: 0.1 factor
        const densityFactor = Math.max(0.1, 1 - forestDensity);
        
        // Calculate base reproduction and apply the reproduction factor
        // Base rate: About 10% of mature trees can reproduce each year
        const baseNewTrees = Math.ceil(matureTrees * 0.1 * densityFactor);
        const adjustedTreeCount = Math.floor(baseNewTrees * scaledReproFactor);
        
        // Only log during main simulation
        if (!this.isStabilizing) {
            console.log(`BAUM: Reproduction - ${matureTrees} mature trees (age >= ${maturityAge}), ` +
                        `density factor: ${densityFactor.toFixed(2)}, ` + 
                        `base seedlings: ${baseNewTrees}, ` + 
                        `adjusted to ${adjustedTreeCount} with factor ${reproductionFactor} (${scaledReproFactor.toFixed(2)} scaled)`);
        }
        
        // Plant the new trees
        this.plantYoungTrees(adjustedTreeCount);
    }

    /**
     * Plant young trees (seedlings)
     * @param {number} amount - Number of trees to plant
     */
    plantYoungTrees(amount) {
        let planted = 0;
        
        for (let i = 0; i < amount; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                if (!this.isStabilizing) {
                    console.log("BAUM: No more space available for new seedlings");
                }
                break;
            }

            // Create a new seedling (age 1)
            const tempTree = new Tree(newPos + 1, 1, 0, 0, 0);
            const calculatedTree = this.calculateTreeProperties(tempTree);
            
            if (calculatedTree) {
                this.trees[newPos] = calculatedTree;
                planted++;
            }
        }
        
        // Only log during main simulation
        if (!this.isStabilizing) {
            const youngTrees = this.trees.filter(tree => tree && tree.position !== 0 && tree.age <= 2).length;
            console.log(`BAUM: Planted ${planted}/${amount} new seedlings. Total young trees (age ≤ 2): ${youngTrees}`);
        }
    }

    /**
     * Set stabilization mode
     * @param {boolean} isStabilizing - Whether the forest is in stabilization phase
     */
    setStabilizationMode(isStabilizing) {
        this.isStabilizing = isStabilizing;
        
        if (!isStabilizing) {
            console.log("BAUM: Exiting stabilization mode, entering simulation mode");
        }
    }
    
    /**
     * Get current population count
     * @returns {number} - Number of living trees
     */
    getPopulationCount() {
        return this.trees.filter(tree => tree && tree.position !== 0).length;
    }

    /**
     * Get statistics about the tree population
     * @returns {Object} - Tree statistics
     */
    getStatistics() { 
        // Get all alive trees
        const aliveTrees = this.trees.filter(tree => tree && tree.position !== 0); 
        
        // Calculate young trees (age ≤ 2)
        const youngTrees = aliveTrees.filter(tree => tree.age <= 2).length;
        
        // Calculate age distribution
        const ageDistribution = this.getAgeDistribution();
        
        // Calculate total deaths including consumption by deer
        const totalDeaths = this.simulationDeaths + this.consumedByDeer;
        
        // Prepare statistics object
        const stats = { 
            total: aliveTrees.length, 
            averageAge: aliveTrees.reduce((sum, tree) => sum + tree.age, 0) / aliveTrees.length || 0, 
            deaths: totalDeaths, // Now includes trees consumed by deer
            stressDeaths: this.stressDeaths,
            ageDeaths: this.ageDeaths,
            concurrenceDeaths: this.concurrenceDeaths,
            consumedByDeer: this.consumedByDeer,
            totalDeaths: totalDeaths, // New property with comprehensive death count
            youngTrees: youngTrees, 
            averageHeight: aliveTrees.reduce((sum, tree) => sum + tree.height, 0) / aliveTrees.length || 0,
            ageDistribution: ageDistribution
        }; 
        
        // Log basic statistics with complete death information
        console.log(`BAUM: Statistics - Population=${stats.total}, ` +
                     `Young Trees=${youngTrees}, ` + 
                     `Avg Age=${stats.averageAge.toFixed(1)}, ` + 
                     `Deaths=${totalDeaths} (Natural=${this.simulationDeaths}, Consumed=${this.consumedByDeer})`);
        
        // Store the current consumedByDeer value before resetting
        const currentConsumed = this.consumedByDeer;
        
        // Reset consumption counter for next cycle
        this.consumedByDeer = 0;
        
        return stats; 
    }

    /**
     * Get age distribution of trees
     * @returns {Object} - Age distribution by category
     */
    getAgeDistribution() {
        const aliveTrees = this.trees.filter(tree => tree && tree.position !== 0);
        
        // Create age brackets for easier visualization
        const distribution = {
            seedling: 0,    // 0-2 years
            young: 0,       // 3-10 years
            mature: 0,      // 11-50 years
            old: 0,         // 51-100 years
            ancient: 0      // 100+ years
        };
        
        aliveTrees.forEach(tree => {
            if (tree.age <= 2) distribution.seedling++;
            else if (tree.age <= 10) distribution.young++;
            else if (tree.age <= 50) distribution.mature++;
            else if (tree.age <= 100) distribution.old++;
            else distribution.ancient++;
        });
        
        return distribution;
    }
}

export { TreeManager };