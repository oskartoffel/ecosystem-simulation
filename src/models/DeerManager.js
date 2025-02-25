// models/DeerManager.js
import { Deer, Tree } from './classes';
import { Utils } from '../utils/helpers';

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
        // New method using a 0-10 scale directly
        // staminaFactor is now a direct multiplier from the UI (also 0-10)
        
        // Base curve that peaks at age 4-5
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 3);
        
        // Apply the staminaFactor as a direct multiplier
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
    reproduce(maturity, reproductionFactor = 1.0) {
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const matureDeer = aliveDeer.filter(deer => deer.age >= maturity);
        
        console.log('Deer Reproduction Debug:', {
            totalDeer: aliveDeer.length,
            matureDeer: matureDeer.length,
            reproductionFactor: reproductionFactor
        });
    
        // Calculate new births based on population density and individual fitness
        // Apply the reproduction factor to control birth rate
        const newBirths = matureDeer.reduce((count, deer) => {
            const populationDensity = aliveDeer.length / this.deers.length;
            const reproductionProbability = 
                0.5 *  // Base probability
                (1 - populationDensity) *  // Reduce probability as population grows
                (deer.stamina / 100000.0) *  // Higher stamina increases reproduction chance
                (1 / (1 + Math.exp(-deer.age + maturity))) *  // Probability peaks around maturity
                reproductionFactor;  // NEW: Apply reproduction factor to control birth rate
    
            if (Math.random() < reproductionProbability) {
                return count + 1;
            }
            return count;
        }, 0);
    
        console.log(`Potential new deer births: ${newBirths} (adjusted by factor ${reproductionFactor})`);
    
        // Add new deer to population
        for (let i = 0; i < newBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) break; // No more space available
            
            const newDeer = new Deer(newPos + 1, 0, 1, 1, 10000);
            this.deers[newPos] = newDeer;
        }
    
        console.log(`Actually added new deer: ${newBirths}`);
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

    calculateForagingSuccess(deer, availableTreeCount, initialTreeCount) {
        // No trees means no chance of finding food
        if (availableTreeCount === 0) return 0;
        
        // Base probability depends on food availability
        const availabilityFactor = availableTreeCount / Math.max(1, initialTreeCount);
        
        // Use stamina directly (assuming 0-10 scale from control panel)
        const staminaFactor = deer.stamina / 10;
        
        // Age factor - prime-age deer have advantage
        const ageFactor = 1.0 - Math.abs(deer.age - 4) / 10; // Peak at age 4
        
        // Combined probability - this represents the deer's ability to find food
        // NOT whether it finds enough food (that's determined by hunger vs. what it finds)
        let probability = 
            (0.3 + 0.4 * availabilityFactor) * // Base chance + availability impact
            (0.7 + 0.3 * staminaFactor) *      // Stamina boost
            (0.8 + 0.2 * ageFactor);           // Age modifier
        
        // Cap probability between 0 and 1
        return Math.max(0, Math.min(1, probability));
    }

    // Handle deer eating trees
    processFeeding(trees, edibleAge = 2) {
        // First, identify all edible trees
        const edibleTrees = trees.filter(tree => 
            tree instanceof Tree && tree.position !== 0 && tree.age <= edibleAge);
        
        const totalEdibleMass = edibleTrees.reduce((sum, tree) => sum + tree.mass, 0);
        const initialEdibleCount = edibleTrees.length;
        
        console.log(`DeerManager: Starting feeding cycle. Available edible trees (age <= ${edibleAge}): ${initialEdibleCount}, mass: ${totalEdibleMass.toFixed(1)}`);
        
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
            
            // Calculate how many trees this deer needs based on hunger
            const avgTreeMass = availableTrees.reduce((sum, t) => sum + t.mass, 0) / availableTrees.length;
            const treesNeededForHunger = Math.ceil(deer.hunger / avgTreeMass);
            
            // Calculate foraging success - this is the deer's ability to find trees, NOT considering hunger
            const foragingSuccess = this.calculateForagingSuccess(
                deer,
                availableTrees.length,
                initialEdibleCount
            );
            
            // Calculate how many trees the deer actually finds
            // This is a probabilistic result between 0 and what it needs
            const successRate = Math.random() * foragingSuccess;
            const treesFound = Math.floor(treesNeededForHunger * successRate);
            
            // Actual trees consumed is limited by what's available
            const treesConsumed = Math.min(
                treesFound,
                Math.floor(availableTrees.length * 0.1), // Cap at 10% of available trees
                availableTrees.length // Can't eat more trees than available
            );
            
            // Calculate if deer found enough food
            const massNeeded = deer.hunger;
            let massConsumed = 0;
            
            // Remove consumed trees from environment
            for (let i = 0; i < treesConsumed && availableTrees.length > 0; i++) {
                // Take a random tree from the available pool
                const randomIndex = Math.floor(Math.random() * availableTrees.length);
                const consumedTree = availableTrees[randomIndex];
                
                // Remove from available pool
                availableTrees.splice(randomIndex, 1);
                
                // Remove from main tree array (mark as consumed)
                const treeIndex = trees.indexOf(consumedTree);
                if (treeIndex !== -1) {
                    trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                    massConsumed += consumedTree.mass;
                }
            }
            
            // Determine if deer survives based on how much it ate compared to what it needed
            if (massConsumed >= massNeeded) {
                console.log(`DeerManager: Deer ${deerIndex} survived: ate ${treesConsumed} trees (${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass)`);
            } else {
                console.log(`DeerManager: Deer ${deerIndex} died: found only ${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass needed`);
                this.killDeer(deerIndex);
            }
        }
        
        const survivingDeer = this.deers.filter(deer => deer.isAlive()).length;
        console.log(`DeerManager: Feeding cycle complete. ${survivingDeer}/${sortedDeerIndices.length} deer survived`);
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
        
        // The base number of migrating deer (can be adjusted with migrationFactor)
        const baseMigrants = 1 + Math.floor(Math.random() * 2); // 1-2 deer by default
        
        // Final number of migrants adjusted by the factor (higher factor = more migration)
        const migrantCount = Math.max(0, Math.round(baseMigrants * migrationFactor));
        
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
                tempDeer.hunger = age > 4 ? 2.0 : (age * 2.0 / 4.0);
                tempDeer.stamina = this.calculateStamina(age, 10000.0); // Fixed stamina factor for migrants
                
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