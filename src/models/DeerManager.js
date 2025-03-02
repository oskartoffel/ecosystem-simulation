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
            
            // Scale hunger based on hunger factor more realistically
            tempDeer.hunger = age > 4 ? hunger : (age * hunger / 4.0);
            
            // Young deer should have lower stamina compared to adults
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
        
        // Adjusted age curve to give young deer lower stamina
        // Peak at age 4-5, but lower for very young deer
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.5);
        
        // Further reduce stamina for very young deer (under 2 years)
        const youthPenalty = age < 2 ? 0.5 : 1.0;
        
        // Apply stamina factor with non-linear impact
        return Math.min(10, baseCurve * scaledFactor * youthPenalty);
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
        // Improved reproduction scaling to make high values more impactful
        // Scale reproduction factor where 5 is "normal"
        // Non-linear scaling: 1=very low, 5=normal, 10=much higher reproduction
        const scaledReproFactor = Math.pow(reproductionFactor / 5.0, 2.5);
        
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const matureDeer = aliveDeer.filter(deer => deer.age >= maturity);
        
        console.log(`REH: Reproduction - ${matureDeer.length}/${aliveDeer.length} mature deer, factor=${reproductionFactor} (${scaledReproFactor.toFixed(2)} scaled)`);
    
        // Keep track of potential births
        let potentialBirths = 0;
        
        // Improved reproduction calculation for better population dynamics
        matureDeer.forEach(deer => {
            // Population density has less impact at mid-range
            const populationDensity = aliveDeer.length / this.deers.length;
            const densityFactor = 1 - (Math.pow(populationDensity, 1.5) * 0.7);
            
            // Higher base probability and stronger reproduction factor impact
            const reproductionProbability = 
                0.5 *  // Increased base probability from 0.4 to 0.5
                densityFactor *  // Improved density impact
                (deer.stamina / 10) *  // Higher stamina increases reproduction chance
                (1 / (1 + Math.exp(-deer.age + maturity))) *  // Probability peaks around maturity
                scaledReproFactor;  // Apply scaled reproduction factor - now more impactful
            
            // Apply a direct multiplier for high reproduction factor
            const finalProbability = reproductionFactor >= 8 ? 
                reproductionProbability * 1.5 : reproductionProbability;
            
            // Debug the probability for a small sample
            if (Math.random() < 0.1) { // 10% sample
                console.log(`REH: Deer ${deer.nr} reproduction chance: ${(finalProbability * 100).toFixed(2)}% (age: ${deer.age.toFixed(1)}, stamina: ${deer.stamina.toFixed(1)})`);
            }
    
            if (Math.random() < finalProbability) {
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
            
            // Give newborn deer appropriate initial values
            const newDeer = new Deer(newPos + 1, 0, 1, 1, 5); // Lower initial stamina
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
     * Process feeding for all deer
     * @param {Array} trees - Array of trees
     * @param {number} edibleAge - Maximum age of trees that deer can eat
     * @param {TreeManager} treeManager - TreeManager instance for tree interaction
     */
    processFeeding(trees, edibleAge, treeManager) {
        // Log the actual edibleAge value being used
        console.log(`REH-DEBUG: Processing feeding with edibleAge=${edibleAge}`);
        
        // CLARIFICATION: edibleAge is the maximum age of trees that deer can eat
        // Any tree with age <= edibleAge can be consumed by deer
        
        // First, identify all edible trees
        const edibleTrees = trees.filter(tree => 
            tree instanceof Tree && tree.position !== 0 && tree.age <= edibleAge);
        
        // Log age distribution of all trees and edible trees
        const allTreeAges = trees
            .filter(tree => tree instanceof Tree && tree.position !== 0)
            .map(tree => tree.age);
        
        console.log(`REH-DEBUG: Tree age distribution - Total trees: ${allTreeAges.length}`);
        
        if (allTreeAges.length > 0) {
            const ageGroups = {
                'age 0-1': 0,
                'age 1-2': 0,
                'age 2-3': 0,
                'age 3-4': 0,
                'age 4-5': 0,
                'age 5+': 0
            };
            
            allTreeAges.forEach(age => {
                if (age <= 1) ageGroups['age 0-1']++;
                else if (age <= 2) ageGroups['age 1-2']++;
                else if (age <= 3) ageGroups['age 2-3']++;
                else if (age <= 4) ageGroups['age 3-4']++;
                else if (age <= 5) ageGroups['age 4-5']++;
                else ageGroups['age 5+']++;
            });
            
            console.log(`REH-DEBUG: Tree ages: ${JSON.stringify(ageGroups)}`);
            console.log(`REH-DEBUG: Edible trees (age <= ${edibleAge}): ${edibleTrees.length} trees`);
        }
        
        const totalEdibleMass = edibleTrees.reduce((sum, tree) => sum + tree.mass, 0);
        const initialEdibleCount = edibleTrees.length;
    
        console.log(`REH: Feeding cycle - ${initialEdibleCount} edible trees (age <= ${edibleAge}) for ${this.getPopulationCount()} deer`);
        
        // Calculate average tree mass for informational purposes only
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
            
            // Scale hunger based on the hunger factor much more significantly
            // This makes hunger level 1-10 scale have a dramatic effect on food needed
            const massNeeded = deer.hunger * 0.2 * Math.pow(deer.hunger / 5, 0.5);
            
            // Calculate foraging success - probability of finding trees
            const foragingSuccess = this.calculateForagingSuccess(
                deer,
                availableTrees.length,
                initialEdibleCount
            );
            
            // Made survival threshold depend on hunger factor
            // Lower hunger factor (1-3) = easier survival at 60% of needed mass
            // Medium hunger factor (4-7) = need 70% of needed mass
            // High hunger factor (8-10) = need 80% of needed mass
            const survivalThreshold = deer.hunger <= 3 ? 0.6 : 
                                    deer.hunger <= 7 ? 0.7 : 0.8;
            
            // NEW: Calculate foraging capacity based on stamina and success
            // This is more realistic - it's how many trees the deer can check while foraging
            // Higher stamina and success rate means more foraging ability
            const foragingCapacity = Math.max(
                1, 
                Math.floor(2 + (deer.stamina / 2) * foragingSuccess * 3)
            );
            
            // Log the foraging attempt with the new approach
            console.log(`REH: Deer ${deerIndex} foraging - success prob: ${foragingSuccess.toFixed(2)}, ` +
                        `foraging capacity: ${foragingCapacity} trees, ` +
                        `mass needed: ${massNeeded.toFixed(2)}, ` +
                        `stamina: ${deer.stamina.toFixed(1)}, ` +
                        `hunger factor: ${deer.hunger.toFixed(1)}`);
            
            let massConsumed = 0;
            // The deer will try to forage up to its capacity
            const treesToCheck = Math.min(
                foragingCapacity,
                availableTrees.length
            );
            
            // Randomize trees instead of sorting by mass
            // Shuffle available trees to simulate random foraging
            const shuffledTrees = [...availableTrees].sort(() => Math.random() - 0.5);
            
            // Track trees completely consumed
            let treesCompletelyConsumed = 0;
            let treesPartiallyConsumed = 0;
            
            // Realistically forage until either satisfied or exhausted foraging capacity
            for (let i = 0; i < treesToCheck && massConsumed < massNeeded; i++) {
                const tree = shuffledTrees[i];
                
                if (!tree) continue;
                
                const treeIndex = trees.indexOf(tree);
                if (treeIndex === -1) continue;
                
                // How much mass does the deer still need?
                const massStillNeeded = massNeeded - massConsumed;
                
                // DEBUG: Log the tree being considered
                console.log(`REH-DEBUG: Considering tree: age=${tree.age.toFixed(1)}, mass=${tree.mass.toFixed(2)}, edible=${tree.age <= edibleAge}`);
            
                // If tree has enough mass to satisfy the deer's remaining need
                if (tree.mass >= massStillNeeded) {
                    // Consume only what's needed
                    massConsumed += massStillNeeded;
                    
                    // Calculate percentage of tree consumed
                    const percentConsumed = massStillNeeded / tree.mass;
                    
                    // DEBUG: Log consumption details
                    console.log(`REH-DEBUG: Consuming ${(percentConsumed*100).toFixed(1)}% of tree age=${tree.age.toFixed(1)}`);
                    
                    // More realistic tree consumption rules
                    // If deer eats 30% or more of tree, tree dies
                    // Also, if tree is very young (age <= 2) and deer eats any of it, tree dies
                    if (percentConsumed >= 0.3 || tree.age <= 2) {
                        // Tree is killed
                        if (treeManager) {
                            treeManager.markAsConsumedByDeer(treeIndex);
                            console.log(`REH: Tree at position ${treeIndex} marked as consumed (age: ${tree.age.toFixed(1)}, ${(percentConsumed*100).toFixed(1)}% eaten)`);
                        } else {
                            trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                            console.log(`REH: Tree at position ${treeIndex} directly consumed (no tree manager available)`);
                        }
                        
                        // Remove from available pool
                        availableTrees = availableTrees.filter(t => t !== tree);
                        treesCompletelyConsumed++;
                    } else {
                        console.log(`REH: Tree survived partial consumption (age: ${tree.age.toFixed(1)}, only ${(percentConsumed*100).toFixed(1)}% eaten)`);
                        treesPartiallyConsumed++;
                    }
                    
                    // Deer's hunger is satisfied, stop consuming
                    break;
                } else {
                    // Tree doesn't have enough mass - consume it entirely
                    massConsumed += tree.mass;
                    
                    // DEBUG: Log the full consumption
                    console.log(`REH-DEBUG: Completely consuming tree age=${tree.age.toFixed(1)}, mass=${tree.mass.toFixed(2)}`);
                    
                    // Remove the completely consumed tree
                    if (treeManager) {
                        treeManager.markAsConsumedByDeer(treeIndex);
                        console.log(`REH: Small tree at position ${treeIndex} completely consumed (age: ${tree.age.toFixed(1)}, mass: ${tree.mass.toFixed(2)})`);
                    } else {
                        trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                        console.log(`REH: Small tree consumed directly (no tree manager)`);
                    }
                    
                    // Remove from available pool
                    availableTrees = availableTrees.filter(t => t !== tree);
                    treesCompletelyConsumed++;
                }
            }
            
            // Determine if deer survives based on how much it ate compared to what it needed
            if (massConsumed >= (massNeeded * survivalThreshold)) {
                console.log(`REH: Deer ${deerIndex} survived by consuming ${massConsumed.toFixed(2)}/${massNeeded.toFixed(2)} mass needed (consumed ${treesCompletelyConsumed} trees completely, ${treesPartiallyConsumed} partially)`);
                totalDeerSurvived++;
            } else {
                console.log(`REH: Deer ${deerIndex} starved, only found ${massConsumed.toFixed(2)}/${massNeeded.toFixed(2)} mass needed (needed ${(massNeeded * survivalThreshold).toFixed(2)} to survive)`);
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
        
        // Make stamina more impactful
        // Use stamina directly (from 0-10 scale)
        const staminaFactor = Math.pow(deer.stamina / 10, 0.8);
        
        // Age factor - prime-age deer have advantage
        const ageFactor = 1.0 - Math.abs(deer.age - 4) / 10; // Peak at age 4
        
        // Combined probability - with more reasonable base rates
        let probability = 
            (0.5 + 0.3 * availabilityFactor) * // Base chance + availability impact
            (0.5 + 0.5 * staminaFactor) *      // Stamina boost - more significant
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