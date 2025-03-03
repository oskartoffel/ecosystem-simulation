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
        
        // Statistics tracking for enhanced UI
        this.migrationCount = 0;
        this.reproductionCount = 0;
        this.foragingSuccessTotal = 0;
        this.foragingAttempts = 0;
      }

    /**
     * Initialize deer population
     */
    initialize(populationSize, arraySize, staminaFactor, hunger) {
        console.log(`REH: Initializing ${populationSize} deer (stamina=${staminaFactor}, hunger=${hunger})`);
        
        // Initialize deers array with empty deer
        this.deers = new Array(arraySize).fill(null).map(() => new Deer(0, 0, 0, 0, 0));
        
        // Reset death counters
        this.ageDeath = 0;
        this.starvationDeath = 0;
        this.predationDeath = 0;
        this.unknownDeath = 0;
        
        let successfulInitCount = 0;
        for (let i = 0; i < populationSize; i++) {
            let newPos = this.findEmptyPosition();
            if (newPos === -1) {
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
        }
        
        console.log(`REH: Created ${successfulInitCount}/${populationSize} deer`);
    }

    /**
     * Calculate deer stamina based on age and stamina factor
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
     */
    findEmptyPosition() {
        const maxAttempts = this.deers.length * 2;  // Prevent infinite loops
        let attempts = 0;
    
        while (attempts < maxAttempts) {
            const emptyPositions = this.deers
                .map((deer, index) => deer.nr === 0 ? index : -1)
                .filter(index => index !== -1);
            
            if (emptyPositions.length === 0) {
                return -1;
            }
    
            const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            if (position < this.deers.length) {
                return position;
            }
    
            attempts++;
        }
    
        return -1;
    }

    /**
     * Simulate growing process for all deer
     */
    grow(staminaFactor, hunger) {
        console.log(`REH: Growing deer population (${this.getPopulationCount()} deer)`);
        
        this.deers.forEach(deer => {
            if (deer.isAlive()) {
                // Update age and recalculate properties
                deer.age += 1;
                deer.mass = deer.age > 4 ? 28 : deer.age * 7;
                deer.hunger = deer.age > 4 ? hunger : (deer.age * hunger / 4);
                deer.stamina = this.calculateStamina(deer.age, staminaFactor);
            }
        });
    }

    /**
     * Kill a deer at the specified index
     */
    killDeer(index, cause = 'unknown') {
        if (index >= 0 && index < this.deers.length && this.deers[index].isAlive()) {
            // Create a new empty deer
            this.deers[index] = new Deer(0, 0, 0, 0, 0);
            
            // Track specific causes of death
            if (cause === 'age') {
                this.ageDeath++;
            } else if (cause === 'starvation') {
                this.starvationDeath++;
            } else if (cause === 'predation') {
                this.predationDeath++;
            } else {
                this.unknownDeath++;
            }
        }
    }

    /**
     * Create new deer births
     */
    reproduce(maturity, reproductionFactor = 5.0) {
        // Scale reproduction factor where 5 is "normal" 

        const scaledReproFactor = 1.4 * Math.pow(reproductionFactor / 5.0, 2.0);
        
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const matureDeer = aliveDeer.filter(deer => deer.age >= maturity);
        
        console.log(`REH: Reproduction (mature=${matureDeer.length}/${aliveDeer.length}, factor=${reproductionFactor})`);
    
        // Keep track of potential births
        let potentialBirths = 0;
        
        // Improved reproduction calculation for better population dynamics
        matureDeer.forEach(deer => {
            // Population density has less impact at mid-range
            const populationDensity = aliveDeer.length / this.deers.length;
            const densityFactor = 1 - (Math.pow(populationDensity, 1.5) * 0.7);
            
            // Higher base probability for more births at normal levels
            const reproductionProbability = 
                0.65 *  
                densityFactor *  
                (deer.stamina / 10) *  
                (1 / (1 + Math.exp(-deer.age + maturity))) *  
                scaledReproFactor;  
            
            // Apply a direct multiplier for high reproduction factor
            const finalProbability = reproductionFactor >= 8 ? 
                reproductionProbability * 1.5 : reproductionProbability;
    
            if (Math.random() < finalProbability) {
                potentialBirths++;
            }
        });
        
        // Add new deer to population
        let actualBirths = 0;
        for (let i = 0; i < potentialBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                break; // No more space available
            }
            
            // Give newborn deer appropriate initial values
            const newDeer = new Deer(newPos + 1, 0, 1, 1, 5); // Lower initial stamina
            this.deers[newPos] = newDeer;
            actualBirths++;
        }
        
        console.log(`REH: Added ${actualBirths} new deer`);
        // Add this line to track reproduction:
        this.reproductionCount += actualBirths;
      
    }

    /**
     * Handle natural deaths due to age
     */
    processNaturalDeaths() {
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
        
        if (deathCount > 0) {
            console.log(`REH: ${deathCount} deer died of old age`);
        }
    }

    /**
     * Process feeding for all deer
     */
    processFeeding(trees, edibleAge, treeManager) {

        console.log(`REH: Feeding cycle - ${this.getPopulationCount()} deer`);
        
        // First, identify all edible trees
        const edibleTrees = trees.filter(tree => 
            tree instanceof Tree && tree.position !== 0 && tree.age <= edibleAge);
        
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
                this.killDeer(deerIndex, 'starvation');
                totalDeerDied++;
                continue;
            }
            
            // Scale hunger based on the hunger factor
            const massNeeded = deer.hunger * 0.2 * Math.pow(deer.hunger / 5, 0.5);
            
            // Calculate foraging success - probability of finding trees
            const foragingSuccess = this.calculateForagingSuccess(
                deer,
                availableTrees.length,
                edibleTrees.length
            );

            this.foragingSuccessTotal += foragingSuccess;
            this.foragingAttempts++;
            
            // Made survival threshold depend on hunger factor
            const survivalThreshold = deer.hunger <= 3 ? 0.6 : 
                                    deer.hunger <= 7 ? 0.7 : 0.8;
            
            // Calculate foraging capacity based on stamina and success
            const foragingCapacity = Math.max(
                1, 
                Math.floor(2 + (deer.stamina / 2) * foragingSuccess * 3)
            );
            
            let massConsumed = 0;
            // The deer will try to forage up to its capacity
            const treesToCheck = Math.min(
                foragingCapacity,
                availableTrees.length
            );
            
            // Randomize trees
            const shuffledTrees = [...availableTrees].sort(() => Math.random() - 0.5);
            
            // Track trees consumed
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

                // If tree has enough mass to satisfy the deer's remaining need
                if (tree.mass >= massStillNeeded) {
                    // Consume only what's needed
                    massConsumed += massStillNeeded;
                    
                    // Calculate percentage of tree consumed
                    const percentConsumed = massStillNeeded / tree.mass;
                    
                    // More realistic tree consumption rules
                    // If deer eats 30% or more of tree, tree dies
                    // Also, if tree is very young (age <= 2) and deer eats any of it, tree dies
                    if (percentConsumed >= 0.3 || tree.age <= 2) {
                        // Tree is killed
                        if (treeManager) {
                            treeManager.markAsConsumedByDeer(treeIndex);
                        } else {
                            trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                        }
                        
                        // Remove from available pool
                        availableTrees = availableTrees.filter(t => t !== tree);
                        treesCompletelyConsumed++;
                    } else {
                        treesPartiallyConsumed++;
                    }
                    
                    // Deer's hunger is satisfied, stop consuming
                    break;
                } else {
                    // Tree doesn't have enough mass - consume it entirely
                    massConsumed += tree.mass;
                    
                    // Remove the completely consumed tree
                    if (treeManager) {
                        treeManager.markAsConsumedByDeer(treeIndex);
                    } else {
                        trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                    }
                    
                    // Remove from available pool
                    availableTrees = availableTrees.filter(t => t !== tree);
                    treesCompletelyConsumed++;
                }
            }
            
            // Determine if deer survives based on how much it ate compared to what it needed
            if (massConsumed >= (massNeeded * survivalThreshold)) {
                totalDeerSurvived++;
            } else {
                this.killDeer(deerIndex, 'starvation');
                totalDeerDied++;
            }
        }
        
        console.log(`REH: Feeding complete - ${totalDeerSurvived} deer survived, ${totalDeerDied} starved`);

    }
    
    /**
     * Calculate deer foraging success (ability to find food)
     */
    calculateForagingSuccess(deer, availableTreeCount, initialTreeCount) {
        // No trees means no chance of finding food
        if (availableTreeCount === 0) return 0;
        
        // Base probability depends on food availability - more scarce = harder to find
        const availabilityFactor = Math.sqrt(availableTreeCount / Math.max(1, initialTreeCount));
        
        // Use a bifurcated approach with different formulas for low vs. normal/high stamina
        let staminaFactor;
        
        // Handle low stamina with a much harsher penalty
        if (deer.stamina <= 3) {
            // Extreme penalty for very low stamina (1-3 range)
            staminaFactor = Math.pow(deer.stamina / 10, 3);
        } else {
            // Normal curve for medium to high stamina (4-10 range)
            staminaFactor = Math.pow(deer.stamina / 10, 0.9);
        }
        
        // Age factor - prime-age deer have advantage
        const ageFactor = 1.0 - Math.abs(deer.age - 4) / 10; // Peak at age 4
        
        // Bifurcated probability calculation
        let probability;
        
        if (deer.stamina <= 3) {
            // Very harsh formula for low stamina
            probability = 
                (0.5 + 0.3 * availabilityFactor) * // Base chance + availability impact
                (0.05 + 0.95 * staminaFactor) *    // Extremely low base (0.05) for low stamina deer
                (0.7 + 0.3 * ageFactor);           // Age modifier
        } else {
            // Original-like formula for normal/high stamina
            probability = 
                (0.5 + 0.3 * availabilityFactor) * // Base chance + availability impact
                (0.4 + 0.6 * staminaFactor) *      // Similar to original formula
                (0.7 + 0.3 * ageFactor);           // Age modifier
        }
        
        // Cap probability between 0 and 1
        return Math.max(0, Math.min(0.9, probability)); // Max 90% success
    }

    /**
     * Process migration of new deer into ecosystem
     */
    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) {
          return;
        }
        
        // Your existing code here...
        // Scale migration factor where 5 is "normal"
        const scaledFactor = Math.pow(migrationFactor / 5.0, 1.8);
        
        // Check current population - if very low, boost migration significantly
        const currentPopulation = this.getPopulationCount();
        let populationBoost = 1.0;
        
        // If fewer than 5 deer, dramatically increase immigration
        if (currentPopulation < 5) {
          populationBoost = 3.0;
        }
        
        // Higher base migrant count (2-4) with population-based boost
        const baseMigrants = 2 + Math.floor(Math.random() * 3); // 2-4 deer
        
        // Final number of migrants adjusted by the factor and population boost
        const migrantCount = Math.max(0, Math.round(baseMigrants * scaledFactor * populationBoost));
        
        if (migrantCount > 0) {
            console.log(`REH: Migration - attempting to add ${migrantCount} deer`);
            
            let localSuccessfulMigrants = 0;
            for (let i = 0; i < migrantCount; i++) {
              let newPos = this.findEmptyPosition();
              if (newPos === -1) {
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
            localSuccessfulMigrants++;
          }
          
          if (localSuccessfulMigrants > 0) {
            console.log(`REH: ${localSuccessfulMigrants} deer successfully migrated in`);
            // Track migrations for statistics
            this.migrationCount = (this.migrationCount || 0) + localSuccessfulMigrants;
            console.log(`REH: Total deer migrations this year: ${this.migrationCount}`);
          }
        }
        return this.migrationCount || 0; // Return the count for easier debuggin
    }

    /**
     * Get current deer population count
     */
    getPopulationCount() {
        return this.deers.filter(deer => deer && deer.isAlive()).length;
    }

    /**
     * Get detailed population statistics
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
        
        console.log(`REH: Deer population: ${stats.total}, Deaths: Age=${this.ageDeath}, Starvation=${this.starvationDeath}, Predation=${this.predationDeath}`);
        
        return stats;
    }

    getDetailedStatistics() {
        // Get basic statistics
        const baseStats = this.getStatistics();
        
        console.log("REH: Detailed stats - Deer migrations:", this.migrationCount || 0);
        
        // Return enhanced statistics
        return {
          ...baseStats,
          // Death causes
          ageDeaths: this.ageDeath,
          starvationDeaths: this.starvationDeath,
          predationDeaths: this.predationDeath,
          
          // Explicitly set migration count, with fallback
          migratedCount: this.migrationCount || 0,
          reproducedCount: this.reproductionCount || 0,
          averageForagingSuccess: this.foragingAttempts > 0 
            ? (this.foragingSuccessTotal / this.foragingAttempts * 100).toFixed(1) + '%'
            : 'N/A'
        };
    }

    resetStatistics() {
        this.migrationCount = 0;
        this.reproductionCount = 0;
        this.foragingSuccessTotal = 0;
        this.foragingAttempts = 0;
    }

    /**
     * Get age distribution of deer population
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