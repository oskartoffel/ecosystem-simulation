// models/DeerManager.js
import { Deer, Tree } from './classes';
import { Utils } from '../utils/helpers';
import { TreeManager } from '../models/TreeManager';

class DeerManager {
    constructor() {
        this.deers = [];
    }

    // Initialize deer population
    initialize(populationSize, arraySize, staminaFactor, hunger) {
        console.log("DeerManager: Starting initialization...", {
            populationSize,
            arraySize,
            staminaFactor,
            hunger
        });
        
        // Initialize deers array with empty deer
        this.deers = new Array(arraySize).fill(null).map(() => new Deer(0, 0, 0, 0, 0));
        
        let successfulInitCount = 0;
        for (let i = 0; i < populationSize; i++) {
            let newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.warn(`DeerManager: No more space available at position ${i}`);
                break;
            }

            const age = Utils.randGauss(8, 3);  // Random age with normal distribution
            const tempDeer = new Deer(newPos + 1, age, 0, 0, 0);
            
            // Calculate properties based on age
            tempDeer.mass = age > 4 ? 28 : age * 7;
            tempDeer.hunger = age > 4 ? hunger : (age * hunger / 4.0);
            tempDeer.stamina = this.calculateStamina(age, staminaFactor);

            this.deers[newPos] = tempDeer;
            successfulInitCount++;
            
            console.log(`DeerManager: Created deer ${i} at position ${newPos}:`, {
                age: tempDeer.age,
                mass: tempDeer.mass,
                hunger: tempDeer.hunger,
                stamina: tempDeer.stamina
            });
        }
        
        console.log(`DeerManager: Initialization complete. Created ${successfulInitCount}/${populationSize} deer`);
    }


    // Helper method to calculate stamina
    calculateStamina(age, staminaFactor) {
        // Base curve that peaks at age 4-5
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.5);
        
        // Directly use the staminaFactor (already 1-10 scale)
        return Math.min(10, baseCurve * (staminaFactor / 5));
      }

    // Find empty position for new deer
    findEmptyPosition() {
        const maxAttempts = this.deers.length * 2;  // Prevent infinite loops
        let attempts = 0;
    
        while (attempts < maxAttempts) {
            const emptyPositions = this.deers
                .map((deer, index) => deer.nr === 0 ? index : -1)
                .filter(index => index !== -1);
            
            if (emptyPositions.length === 0) {
                console.log("DeerManager: No empty positions available in array of size", this.deers.length);
                return -1;
            }
    
            const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            if (position < this.deers.length) {
                return position;
            }
    
            attempts++;
        }
    
        console.log("DeerManager: Could not find valid position after", maxAttempts, "attempts");
        return -1;
    }

    // Simulate growing process for all deer
    grow(staminaFactor, hunger) {
        this.deers.forEach(deer => {
            if (deer.isAlive()) {
                deer.age += 1;
                deer.mass = deer.age > 4 ? 28 : deer.age * 7;
                deer.hunger = deer.age > 4 ? hunger : (deer.age * hunger / 4);
                deer.stamina = this.calculateStamina(deer.age, staminaFactor);
            }
        });
    }

    // Handle deer death
    killDeer(index) {
        if (index >= 0 && index < this.deers.length) {
            this.deers[index] = new Deer(0, 0, 0, 0, 0);
        }
    }

    // Create new deer births
    reproduce(maturity, reproductionFactor = 5.0) {
        // Scale reproduction factor where 5 is "normal"
        const scaledReproFactor = reproductionFactor / 5.0;
        
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const matureDeer = aliveDeer.filter(deer => deer.age >= maturity);
        
        console.log('Deer Reproduction Debug:', {
            totalDeer: aliveDeer.length,
            matureDeer: matureDeer.length,
            reproductionFactor: reproductionFactor
        });
    
        // Keep track of potential births
        let potentialBirths = 0;
        
        // Calculate new births based on individual deer reproduction chances
        matureDeer.forEach(deer => {
            const populationDensity = aliveDeer.length / this.deers.length;
            
            // Calculate reproduction probability with appropriate scaling
            const reproductionProbability = 
                0.2 *  // Base probability
                (1 - populationDensity) *  // Reduce probability as population grows
                (deer.stamina / 10) *  // Higher stamina increases reproduction chance (now properly scaled)
                (1 / (1 + Math.exp(-deer.age + maturity))) *  // Probability peaks around maturity
                scaledReproFactor;  // Apply scaled reproduction factor
            
            // Debug the probability
            if (Math.random() < 0.1) { // Only log 10% of calculations to avoid spam
                console.log(`Deer ${deer.nr} reproduction chance: ${(reproductionProbability * 100).toFixed(2)}% (age: ${deer.age.toFixed(1)}, stamina: ${deer.stamina.toFixed(1)})`);
            }
    
            if (Math.random() < reproductionProbability) {
                potentialBirths++;
            }
        });
        
        console.log(`Potential new deer births: ${potentialBirths} (adjusted by factor ${reproductionFactor})`);
        
        // Add new deer to population
        let actualBirths = 0;
        for (let i = 0; i < potentialBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("No more space available for new deer");
                break; // No more space available
            }
            
            const newDeer = new Deer(newPos + 1, 0, 1, 1, 10);
            this.deers[newPos] = newDeer;
            actualBirths++;
        }
        
        console.log(`Actually added new deer: ${actualBirths}`);
    }

    // Handle natural deaths due to age
    processNaturalDeaths() {
        this.deers.forEach((deer, index) => {
            if (deer.isAlive()) {
                const deathAge = Utils.randGauss(10, 2);
                if (deer.age > deathAge) {
                    console.log(`Deer ${index} died of old age at ${deer.age} years`);
                    this.killDeer(index);
                }
            }
        });
    }

    // Validate that trees are proper Tree instances
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
    
    isTreeEdible(tree, maxEdibleAge) {
        return tree instanceof Tree && tree.position !== 0 && tree.age <= maxEdibleAge;
    }

    processFeeding(trees, edibleAge = 2) {
        // First, identify all edible trees
        const edibleTrees = trees.filter(tree => 
            tree instanceof Tree && tree.position !== 0 && tree.age <= edibleAge);
        
        const totalEdibleMass = edibleTrees.reduce((sum, tree) => sum + tree.mass, 0);
        const initialEdibleCount = edibleTrees.length;

        console.log(`DeerManager: Edible trees to deer ratio: ${edibleTrees.length}:${this.getPopulationCount()}`);
        // Calculate average tree mass
        const avgTreeMass = initialEdibleCount > 0 ? totalEdibleMass / initialEdibleCount : 0;
        
        console.log(`DeerManager: Starting feeding cycle. Available edible trees (age <= ${edibleAge}): ${initialEdibleCount}, total mass: ${totalEdibleMass.toFixed(1)}, avg mass: ${avgTreeMass.toFixed(3)} per tree`);
        
        // Create a copy of edible trees to track which ones remain available
        let availableTrees = [...edibleTrees];
        
        // Sort deer by stamina so stronger deer feed first (natural competition)
        const sortedDeerIndices = this.deers
            .map((deer, index) => ({ deer, index }))
            .filter(item => item.deer.isAlive())
            .sort((a, b) => b.deer.stamina - a.deer.stamina)
            .map(item => item.index);
        
        for (const deerIndex of sortedDeerIndices) {
            const deer = this.deers[deerIndex];
            
            // No trees left means no chance of survival
            if (availableTrees.length === 0) {
                console.log(`DeerManager: Deer ${deerIndex} died: No edible trees remain`);
                this.killDeer(deerIndex);
                continue;
            }
            
            // Scale hunger based on the hunger factor (5 is baseline)
            // A deer with hungerFactor=5 needs about 0.5 mass units
            const massNeeded = deer.hunger * 0.1;
            
            // Calculate foragingSuccess - probability of finding trees
            const foragingSuccess = this.calculateForagingSuccess(
                deer,
                availableTrees.length,
                initialEdibleCount
            );
            
            // Calculate how many trees the deer actually finds
            const successRate = Math.max(0.5, foragingSuccess); // Use a reasonable minimum success rate

            const survivalThreshold = edibleTrees.length < this.getPopulationCount() * 3 ? 0.5 : 0.6;
            // Calculate trees needed and found
            const treesNeededForHunger = Math.max(1, Math.ceil(massNeeded / Math.max(0.01, avgTreeMass)));
            const treesFound = Math.max(1, Math.floor(treesNeededForHunger * successRate));
            
            // Log the probability calculations
            console.log(`DeerManager: Deer ${deerIndex} foraging - success prob: ${foragingSuccess.toFixed(2)}, ` +
                        `applied rate: ${successRate.toFixed(2)}, trees needed: ${treesNeededForHunger}, ` +
                        `trees found: ${treesFound}, stamina: ${deer.stamina.toFixed(1)}, age: ${deer.age.toFixed(1)}`);
            
            // Actual trees consumed is limited by what's available
            const treesConsumed = Math.min(
                treesFound,
                Math.ceil(availableTrees.length * 0.3), // Limit to 30% of available trees
                availableTrees.length // Can't eat more trees than available
            );
            
            let massConsumed = 0;
            
            // Remove consumed trees from environment
            for (let i = 0; i < treesConsumed && availableTrees.length > 0; i++) {
                // Sort trees by mass and take the highest mass trees first (more efficient foraging)
                availableTrees.sort((a, b) => b.mass - a.mass);
                const consumedTree = availableTrees[0]; // Take highest mass tree
                
                // Remove from available pool
                availableTrees.splice(0, 1);
                
                // Remove from main tree array (mark as consumed)
                const treeIndex = trees.indexOf(consumedTree);
                if (treeIndex !== -1) {
                    // Store the mass before marking it consumed
                    const treeMass = consumedTree.mass;
                    
                    // Use the TreeManager method to mark it consumed
                    treeManager.markAsConsumedByDeer(treeIndex);
                    
                    // Add the consumed mass to the deer's total
                    massConsumed += treeMass;
                    
                    console.log(`DeerManager: Tree at index ${treeIndex} consumed by deer, mass: ${treeMass.toFixed(2)}`);
                    
                    // If we've accumulated enough mass, stop consuming trees
                    if (massConsumed >= massNeeded) {
                        break;
                    }
                }
            }
            
            // Determine if deer survives based on how much it ate compared to what it needed
            if (massConsumed >= (massNeeded * survivalThreshold)) {
                console.log(`DeerManager: Deer ${deerIndex} survived...`);
            } else {
                console.log(`DeerManager: Deer ${deerIndex} died...`);
                this.killDeer(deerIndex);
            }
        }
        
        const survivingDeer = this.deers.filter(deer => deer.isAlive()).length;
        console.log(`DeerManager: Feeding cycle complete. ${survivingDeer}/${sortedDeerIndices.length} deer survived`);
    }
    
    // Helper method to calculate foraging success (ability to find food)
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
    

    // Helper method to check if deer is satisfied
    isSatisfied(consumed, hunger) {
        return consumed >= hunger;
    }

    // Get current population count
    getPopulationCount() {
        return this.deers.filter(deer => deer && deer.isAlive()).length;
    }

    // Get detailed population statistics
    getStatistics() {
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const stats = {
            total: aliveDeer.length,
            averageAge: aliveDeer.reduce((sum, deer) => sum + deer.age, 0) / aliveDeer.length || 0,
            averageStamina: aliveDeer.reduce((sum, deer) => sum + deer.stamina, 0) / aliveDeer.length || 0
        };
        
        console.log(`Deer Statistics: Population=${stats.total}, Avg Age=${stats.averageAge.toFixed(1)}, Avg Stamina=${stats.averageStamina.toFixed(1)}`);
        
        return stats;
    }

    // Helper method to get age distribution
    getAgeDistribution(aliveDeer) {
        const distribution = {};
        aliveDeer.forEach(deer => {
            distribution[deer.age] = (distribution[deer.age] || 0) + 1;
        });
        return distribution;
    }

    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) return;
        
        // Scale migration factor where 5 is "normal"
        const scaledFactor = migrationFactor / 5.0;
        
        // The base number of migrating deer
        const baseMigrants = 1 + Math.floor(Math.random() * 2); // 1-2 deer by default
        
        // Final number of migrants adjusted by the factor
        const migrantCount = Math.max(0, Math.round(baseMigrants * scaledFactor));
        
        if (migrantCount > 0) {
            console.log(`DeerManager: ${migrantCount} deer migrating into the ecosystem`);
            
            let successfulMigrants = 0;
            for (let i = 0; i < migrantCount; i++) {
                let newPos = this.findEmptyPosition();
                if (newPos === -1) {
                    console.warn("DeerManager: No space available for migrating deer");
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
                console.log(`DeerManager: ${successfulMigrants} deer successfully migrated into the ecosystem`);
            }
        }
    }

    // Debug method to show deer details
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