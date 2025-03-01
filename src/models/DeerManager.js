// models/DeerManager.js
import { Deer, Tree } from './classes';
import { Utils } from '../utils/helpers';

/**
 * DeerManager handles all deer lifecycle operations including:
 * - Initialization and population management
 * - Growth and aging
 * - Reproduction
 * - Death (age, starvation)
 * - Feeding behavior
 * - Migration
 */
class DeerManager {
    constructor() {
        this.deers = [];
        // Death tracking
        this.ageDeath = 0;
        this.starvationDeath = 0;
        this.predationDeath = 0;
        this.unknownDeath = 0;
    }

    /**
     * Initialize deer population
     * @param {number} populationSize - Initial deer population
     * @param {number} arraySize - Size of the deer array
     * @param {number} staminaFactor - Factor affecting deer stamina (1-10 scale)
     * @param {number} hunger - Hunger factor (1-10 scale)
     */
    initialize(populationSize, arraySize, staminaFactor, hunger) {
        console.log(`REH: Starting initialization with population=${populationSize}, stamina=${staminaFactor}, hunger=${hunger}`);
        
        // Initialize deers array with empty deer
        this.deers = new Array(arraySize).fill(null).map(() => new Deer(0, 0, 0, 0, 0));
        
        let successfulInitCount = 0;
        for (let i = 0; i < populationSize; i++) {
            let newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.warn(`REH: No more space available at position ${i}`);
                break;
            }

            // Create age-distributed population (normal distribution)
            const age = Utils.randGauss(8, 3);  // Random age with normal distribution
            const tempDeer = new Deer(newPos + 1, age, 0, 0, 0);
            
            // Calculate properties based on age
            tempDeer.mass = age > 4 ? 28 : age * 7;
            tempDeer.hunger = age > 4 ? hunger : (age * hunger / 4.0);
            tempDeer.stamina = this.calculateStamina(age, staminaFactor);

            this.deers[newPos] = tempDeer;
            successfulInitCount++;
            
            console.log(`REH: Created deer ${i} at position ${newPos}: age=${tempDeer.age.toFixed(1)}, mass=${tempDeer.mass.toFixed(1)}, stamina=${tempDeer.stamina.toFixed(1)}`);
        }
        
        console.log(`REH: Initialization complete. Created ${successfulInitCount}/${populationSize} deer`);
    }

    /**
     * Calculate deer stamina based on age and stamina factor
     * @param {number} age - Deer age
     * @param {number} staminaFactor - Stamina factor (1-10 scale)
     * @returns {number} - Calculated stamina value
     */
    calculateStamina(age, staminaFactor) {
        // Normalize staminaFactor to 1-10 scale
        const normalizedFactor = Math.min(10, Math.max(1, staminaFactor));
        
        // Apply non-linear scaling (1=very weak, 5=normal, 10=very strong)
        const scaledFactor = Math.pow(normalizedFactor / 5.0, 1.5);
        
        // Base curve that peaks at age 4-5 (prime age for deer)
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.5);
        
        // Apply stamina factor with non-linear impact
        return Math.min(10, baseCurve * scaledFactor);
    }

    /**
     * Find an empty position in the deer array
     * @returns {number} - Index of empty position or -1 if none available
     */
    findEmptyPosition() {
        const maxAttempts = this.deers.length * 2;  // Prevent infinite loops
        let attempts = 0;
    
        while (attempts < maxAttempts) {
            const emptyPositions = this.deers
                .map((deer, index) => deer.nr === 0 ? index : -1)
                .filter(index => index !== -1);
            
            if (emptyPositions.length === 0) {
                console.log("REH: No empty positions available in array");
                return -1;
            }
    
            const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            if (position < this.deers.length) {
                return position;
            }
    
            attempts++;
        }
    
        console.log("REH: Could not find valid position after", maxAttempts, "attempts");
        return -1;
    }

    /**
     * Simulate growing process for all deer
     * @param {number} staminaFactor - Stamina factor (1-10 scale)
     * @param {number} hunger - Hunger factor (1-10 scale)
     */
    grow(staminaFactor, hunger) {
        const initialCount = this.getPopulationCount();
        console.log(`REH: Growing deer population (${initialCount} deer)`);
        
        this.deers.forEach(deer => {
            if (deer.isAlive()) {
                // Store original values for logging
                const oldAge = deer.age;
                const oldStamina = deer.stamina;
                
                // Update age and recalculate properties
                deer.age += 1;
                deer.mass = deer.age > 4 ? 28 : deer.age * 7;
                deer.hunger = deer.age > 4 ? hunger : (deer.age * hunger / 4);
                deer.stamina = this.calculateStamina(deer.age, staminaFactor);
                
                // Only log a sample of deer to avoid excessive logs
                if (Math.random() < 0.1) { // 10% sample
                    console.log(`REH: Deer grew from age ${oldAge.toFixed(1)} to ${deer.age.toFixed(1)}, stamina ${oldStamina.toFixed(1)} to ${deer.stamina.toFixed(1)}`);
                }
            }
        });
        
        console.log(`REH: Growth complete for deer population`);
    }

    /**
     * Kill a deer at the specified index
     * @param {number} index - Index of deer to kill
     * @param {string} cause - Cause of death for tracking
     */
    killDeer(index, cause = 'unknown') {
        if (index >= 0 && index < this.deers.length && this.deers[index].isAlive()) {
            const age = this.deers[index].age;
            
            // Create a new empty deer
            this.deers[index] = new Deer(0, 0, 0, 0, 0);
            
            // Track specific causes of death
            if (cause === 'age') {
                this.ageDeath++;
                console.log(`REH: Deer at position ${index} died of old age (${age.toFixed(1)} years)`);
            } else if (cause === 'starvation') {
                this.starvationDeath++;
                console.log(`REH: Deer at position ${index} died of starvation`);
            } else if (cause === 'predation') {
                this.predationDeath++;
                console.log(`REH: Deer at position ${index} killed by predator`);
            } else {
                this.unknownDeath++;
                console.log(`REH: Deer at position ${index} died (cause: ${cause})`);
            }
        }
    }

    /**
     * Create new deer births
     * @param {number} maturity - Age at which deer can reproduce
     * @param {number} reproductionFactor - Factor affecting reproduction rate (1-10 scale)
     */
    reproduce(maturity, reproductionFactor = 5.0) {
        // Scale reproduction factor where 5 is "normal"
        // Apply non-linear scaling (1=very low, 5=normal, 10=very high reproduction)
        const scaledReproFactor = Math.pow(reproductionFactor / 5.0, 1.8);
        
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const matureDeer = aliveDeer.filter(deer => deer.age >= maturity);
        
        console.log(`REH: Reproduction - ${matureDeer.length}/${aliveDeer.length} mature deer, factor=${reproductionFactor} (${scaledReproFactor.toFixed(2)} scaled)`);
    
        // Keep track of potential births
        let potentialBirths = 0;
        
        // Calculate new births based on individual deer reproduction chances
        matureDeer.forEach(deer => {
            const populationDensity = aliveDeer.length / this.deers.length;
            
            // FIXED: Increased base probability and made density less impactful
            const reproductionProbability = 
                0.4 *  // Increased base probability from 0.2 to 0.4
                (1 - populationDensity * 0.5) *  // Less density impact
                (deer.stamina / 10) *  // Higher stamina increases reproduction chance
                (1 / (1 + Math.exp(-deer.age + maturity))) *  // Probability peaks around maturity
                scaledReproFactor;  // Apply scaled reproduction factor
            
            // Debug the probability for a small sample
            if (Math.random() < 0.1) { // 10% sample
                console.log(`REH: Deer ${deer.nr} reproduction chance: ${(reproductionProbability * 100).toFixed(2)}% (age: ${deer.age.toFixed(1)}, stamina: ${deer.stamina.toFixed(1)})`);
            }
    
            if (Math.random() < reproductionProbability) {
                potentialBirths++;
            }
        });
        
        console.log(`REH: Potential new deer births: ${potentialBirths} (adjusted by factor ${reproductionFactor})`);
        
        // Add new deer to population
        let actualBirths = 0;
        for (let i = 0; i < potentialBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("REH: No more space available for new deer");
                break; // No more space available
            }
            
            const newDeer = new Deer(newPos + 1, 0, 1, 1, 10);
            this.deers[newPos] = newDeer;
            actualBirths++;
        }
        
        console.log(`REH: Actually added ${actualBirths} new deer`);
    }

    /**
     * Handle natural deaths due to age
     */
    processNaturalDeaths() {
        console.log("REH: Processing natural deaths");
        let deathCount = 0;
        
        this.deers.forEach((deer, index) => {
            if (deer.isAlive()) {
                const deathAge = Utils.randGauss(10, 2); // Normal distribution with mean 10, SD 2
                if (deer.age > deathAge) {
                    this.killDeer(index, 'age');
                    deathCount++;
                }
            }
        });
        
        console.log(`REH: ${deathCount} deer died of natural causes`);
    }

    /**
     * Find a young tree for a deer to eat
     * @param {Array} trees - Array of trees
     * @param {number} maxEdibleAge - Maximum age of trees that can be eaten
     * @returns {Tree|null} - Found tree or null if none available
     */
    findYoungTree(trees, maxEdibleAge = 2) {
        // First check if any young trees exist to avoid wasting attempts
        const edibleTrees = trees.filter(tree => 
            tree instanceof Tree && tree.position !== 0 && tree.age <= maxEdibleAge);
        
        if (edibleTrees.length === 0) {
            return null; // No edible trees available
        }
        
        // Select a random edible tree directly from the filtered list
        const randomIndex = Math.floor(Math.random() * edibleTrees.length);
        return edibleTrees[randomIndex];
    }
    
    /**
     * Check if a tree is edible
     * @param {Tree} tree - Tree to check
     * @param {number} maxEdibleAge - Maximum age of trees that can be eaten
     * @returns {boolean} - Whether the tree is edible
     */
    isTreeEdible(tree, maxEdibleAge) {
        return tree instanceof Tree && tree.position !== 0 && tree.age <= maxEdibleAge;
    }

    /**
     * Process feeding for all deer
     * @param {Array} trees - Array of trees
     * @param {number} edibleAge - Maximum age of trees that deer can eat
     * @param {TreeManager} treeManager - TreeManager instance for tree interaction
     */
    processFeeding(trees, edibleAge = 4, treeManager) {
        // First, identify all edible trees
        const edibleTrees = trees.filter(tree => 
            tree instanceof Tree && tree.position !== 0 && tree.age <= edibleAge);
        
        const totalEdibleMass = edibleTrees.reduce((sum, tree) => sum + tree.mass, 0);
        const initialEdibleCount = edibleTrees.length;
    
        console.log(`REH: Feeding cycle - ${initialEdibleCount} edible trees (age <= ${edibleAge}) for ${this.getPopulationCount()} deer`);
        
        // Calculate average tree mass
        const avgTreeMass = initialEdibleCount > 0 ? totalEdibleMass / initialEdibleCount : 0;
        console.log(`REH: Available tree mass: ${totalEdibleMass.toFixed(1)} total, ${avgTreeMass.toFixed(3)} per tree`);
        
        // Create a copy of edible trees to track which ones remain available
        let availableTrees = [...edibleTrees];
        
        // Sort deer by stamina so stronger deer feed first (natural competition)
        const sortedDeerIndices = this.deers
            .map((deer, index) => ({ deer, index }))
            .filter(item => item.deer.isAlive())
            .sort((a, b) => b.deer.stamina - a.deer.stamina)
            .map(item => item.index);
        
        let totalDeerSurvived = 0;
        let totalDeerDied = 0;
        
        for (const deerIndex of sortedDeerIndices) {
            const deer = this.deers[deerIndex];
            
            // No trees left means no chance of survival
            if (availableTrees.length === 0) {
                console.log(`REH: Deer ${deerIndex} found no edible trees remaining`);
                this.killDeer(deerIndex, 'starvation');
                totalDeerDied++;
                continue;
            }
            
            // Scale hunger based on the hunger factor (5 is baseline)
            const massNeeded = deer.hunger * 0.05;
            
            // Calculate foraging success - probability of finding trees
            const foragingSuccess = this.calculateForagingSuccess(
                deer,
                availableTrees.length,
                initialEdibleCount
            );
            
            // Calculate how many trees the deer actually finds
            const successRate = Math.max(0.5, foragingSuccess);
            const survivalThreshold = edibleTrees.length < this.getPopulationCount() * 3 ? 0.4 : 0.5;
            
            // Calculate trees needed for reference
            const treesNeededForHunger = Math.max(1, Math.ceil(massNeeded / Math.max(0.01, avgTreeMass)));
            const treesFound = Math.max(1, Math.floor(treesNeededForHunger * successRate));
            
            // Log the foraging attempt
            console.log(`REH: Deer ${deerIndex} foraging - success prob: ${foragingSuccess.toFixed(2)}, ` +
                        `success rate: ${successRate.toFixed(2)}, ` +
                        `trees needed: ${treesNeededForHunger}, ` +
                        `trees found: ${treesFound}, ` +
                        `stamina: ${deer.stamina.toFixed(1)}, ` +
                        `age: ${deer.age.toFixed(1)}`);
            
            // NEW: Improved efficient feeding approach
            let massConsumed = 0;
            const treesToConsume = Math.min(
                treesFound,
                Math.ceil(availableTrees.length * 0.3),
                availableTrees.length
            );
            
            // Sort trees by mass for realistic selection
            availableTrees.sort((a, b) => b.mass - a.mass);
            
            // Track trees completely consumed
            let treesCompletelyConsumed = 0;
            
            // First try to consume only what's needed from available trees
            for (let i = 0; i < treesToConsume && massConsumed < massNeeded; i++) {
                const tree = availableTrees[i];
                
                if (!tree) continue;
                
                const treeIndex = trees.indexOf(tree);
                if (treeIndex === -1) continue;
                
                // How much mass does the deer still need?
                const massStillNeeded = massNeeded - massConsumed;
                
                // If tree has enough mass to satisfy the deer's remaining need
                if (tree.mass >= massStillNeeded) {
                    // Consume only what's needed
                    massConsumed += massStillNeeded;
                    
                    // Calculate percentage of tree consumed
                    const percentConsumed = massStillNeeded / tree.mass;
                    
                    // SIMPLIFIED CONDITION: If deer eats 30% or more of tree, tree dies
                    // Also, if tree is young (age <= 4) and deer eats any of it, tree dies
                    if (percentConsumed >= 0.3 || tree.age <= 4) {
                        // Tree is killed
                        if (treeManager) {
                            treeManager.markAsConsumedByDeer(treeIndex);
                            console.log(`REH-DEBUG: Tree at position ${treeIndex} marked as consumed (age: ${tree.age.toFixed(1)}, ${(percentConsumed*100).toFixed(1)}% eaten)`);
                        } else {
                            trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                            console.log(`REH-DEBUG: Tree at position ${treeIndex} directly consumed (no tree manager available)`);
                        }
                        
                        // Remove from available pool
                        availableTrees.splice(i, 1);
                        i--; // Adjust index since we removed an item
                        treesCompletelyConsumed++;
                    } else {
                        console.log(`REH-DEBUG: Tree survived partial consumption (age: ${tree.age.toFixed(1)}, only ${(percentConsumed*100).toFixed(1)}% eaten)`);
                    }
                    
                    // Deer's hunger is satisfied, stop consuming
                    break;
                } else {
                    // Tree doesn't have enough mass - consume it entirely
                    massConsumed += tree.mass;
                    
                    // Remove the completely consumed tree
                    if (treeManager) {
                        treeManager.markAsConsumedByDeer(treeIndex);
                        console.log(`REH-DEBUG: Small tree at position ${treeIndex} completely consumed (age: ${tree.age.toFixed(1)}, mass: ${tree.mass.toFixed(2)})`);
                    } else {
                        trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                        console.log(`REH-DEBUG: Small tree consumed directly (no tree manager)`);
                    }
                    
                    // Remove from available pool
                    availableTrees.splice(i, 1);
                    i--; // Adjust index since we removed an item
                    treesCompletelyConsumed++;
                }
            }
            
            // Determine if deer survives based on how much it ate compared to what it needed
            if (massConsumed >= (massNeeded * survivalThreshold)) {
                console.log(`REH: Deer ${deerIndex} survived by consuming ${massConsumed.toFixed(2)}/${massNeeded.toFixed(2)} mass needed (consumed ${treesCompletelyConsumed} trees)`);
                totalDeerSurvived++;
            } else {
                console.log(`REH: Deer ${deerIndex} starved, only found ${massConsumed.toFixed(2)}/${massNeeded.toFixed(2)} mass needed`);
                this.killDeer(deerIndex, 'starvation');
                totalDeerDied++;
            }
        }
        
        console.log(`REH: Feeding cycle complete. ${totalDeerSurvived}/${sortedDeerIndices.length} deer survived, ${totalDeerDied} starved`);
    }
    
    /**
     * Calculate deer foraging success (ability to find food)
     * @param {Deer} deer - Deer attempting to forage
     * @param {number} availableTreeCount - Number of available trees
     * @param {number} initialTreeCount - Initial number of trees
     * @returns {number} - Probability of successful foraging
     */
    calculateForagingSuccess(deer, availableTreeCount, initialTreeCount) {
        // No trees means no chance of finding food
        if (availableTreeCount === 0) return 0;
        
        // Base probability depends on food availability - more scarce = harder to find
        const availabilityFactor = Math.sqrt(availableTreeCount / Math.max(1, initialTreeCount));
        
        // Use stamina directly (from 0-10 scale)
        const staminaFactor = Math.min(1.0, deer.stamina / 10);
        
        // Age factor - prime-age deer have advantage
        const ageFactor = 1.0 - Math.abs(deer.age - 4) / 10; // Peak at age 4
        
        // Combined probability - with more reasonable base rates
        let probability = 
            (0.5 + 0.3 * availabilityFactor) * // Base chance + availability impact
            (0.6 + 0.4 * staminaFactor) *      // Stamina boost
            (0.7 + 0.3 * ageFactor);           // Age modifier
        
        // Cap probability between 0 and 1
        return Math.max(0, Math.min(0.9, probability)); // Max 90% success
    }

    /**
     * Process migration of new deer into ecosystem
     * @param {number} migrationFactor - Factor affecting migration rate (1-10 scale)
     */
    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) return;
        
        // Scale migration factor where 5 is "normal"
        // Apply non-linear scaling for wider impact range
        const scaledFactor = Math.pow(migrationFactor / 5.0, 1.5);
        
        // The base number of migrating deer
        const baseMigrants = 1 + Math.floor(Math.random() * 2); // 1-2 deer by default
        
        // Final number of migrants adjusted by the factor
        const migrantCount = Math.max(0, Math.round(baseMigrants * scaledFactor));
        
        if (migrantCount > 0) {
            console.log(`REH: ${migrantCount} deer migrating into the ecosystem (factor=${migrationFactor})`);
            
            let successfulMigrants = 0;
            for (let i = 0; i < migrantCount; i++) {
                let newPos = this.findEmptyPosition();
                if (newPos === -1) {
                    console.warn("REH: No space available for migrating deer");
                    break;
                }
                
                // Create a mature deer with reasonable stats
                const age = Utils.randGauss(4, 1);  // Young adult deer
                const tempDeer = new Deer(newPos + 1, age, 0, 0, 0);
                
                // Calculate properties based on age
                tempDeer.mass = age > 4 ? 28 : age * 7;
                tempDeer.hunger = age > 4 ? 5.0 : (age * 5.0 / 4.0); // Use 5 as baseline hunger
                tempDeer.stamina = this.calculateStamina(age, 5.0); // Use 5 as baseline stamina
                
                this.deers[newPos] = tempDeer;
                successfulMigrants++;
            }
            
            if (successfulMigrants > 0) {
                console.log(`REH: ${successfulMigrants} deer successfully migrated into the ecosystem`);
            }
        }
    }

    /**
     * Get current deer population count
     * @returns {number} - Number of living deer
     */
    getPopulationCount() {
        return this.deers.filter(deer => deer && deer.isAlive()).length;
    }

    /**
     * Get detailed population statistics
     * @returns {Object} - Statistics about the deer population
     */
    getStatistics() {
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        
        const stats = {
            total: aliveDeer.length,
            averageAge: aliveDeer.reduce((sum, deer) => sum + deer.age, 0) / aliveDeer.length || 0,
            averageStamina: aliveDeer.reduce((sum, deer) => sum + deer.stamina, 0) / aliveDeer.length || 0,
            ageDeaths: this.ageDeath,
            starvationDeaths: this.starvationDeath,
            predationDeaths: this.predationDeath,
            unknownDeaths: this.unknownDeath,
            ageDistribution: this.getAgeDistribution(aliveDeer)
        };
        
        console.log(`REH: Statistics - Population=${stats.total}, Avg Age=${stats.averageAge.toFixed(1)}, Avg Stamina=${stats.averageStamina.toFixed(1)}, Deaths: Age=${this.ageDeath}, Starvation=${this.starvationDeath}, Predation=${this.predationDeath}, Unknown=${this.unknownDeath}`);
        
        return stats;
    }

    /**
     * Get age distribution of deer population
     * @param {Array} aliveDeer - Array of living deer
     * @returns {Object} - Age distribution
     */
    getAgeDistribution(aliveDeer) {
        const distribution = {};
        aliveDeer.forEach(deer => {
            const ageKey = Math.floor(deer.age);
            distribution[ageKey] = (distribution[ageKey] || 0) + 1;
        });
        return distribution;
    }

    /**
     * Debug method to show deer details
     * @param {number} index - Index of deer to debug
     * @returns {Object|null} - Deer details or null if not found
     */
    debugDeer(index) {
        const deer = this.deers[index];
        if (!deer) return null;
        
        return {
            number: deer.nr,
            age: deer.age,
            mass: deer.mass,
            hunger: deer.hunger,
            stamina: deer.stamina
        };
    }
}

export { DeerManager };