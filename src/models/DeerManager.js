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
        return staminaFactor * (13.26 * Math.exp(
            -Math.pow(age - 4.51, 2) / (2 * 3.28 * 3.28)
        ));
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
    reproduce(maturity) {
        const aliveDeer = this.deers.filter(deer => deer.isAlive());
        const matureDeer = aliveDeer.filter(deer => deer.age >= maturity);
        
        console.log('Deer Reproduction Debug:', {
            totalDeer: aliveDeer.length,
            matureDeer: matureDeer.length
        });
    
        // Calculate new births based on population density and individual fitness
        const newBirths = matureDeer.reduce((count, deer) => {
            const populationDensity = aliveDeer.length / this.deers.length;
            const reproductionProbability = 
                0.5 *  // Base probability
                (1 - populationDensity) *  // Reduce probability as population grows
                (deer.stamina / 100000.0) *  // Higher stamina increases reproduction chance
                (1 / (1 + Math.exp(-deer.age + maturity)));  // Probability peaks around maturity
    
            if (Math.random() < reproductionProbability) {
                return count + 1;
            }
            return count;
        }, 0);
    
        console.log(`Potential new deer births: ${newBirths}`);
    
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
    findYoungTree(trees) {
        const randomIndex = Math.floor(Math.random() * trees.length);
        const tree = trees[randomIndex];
        
        // Simple validation, no logging
        if (tree instanceof Tree && tree.position !== 0 && tree.age <= 2) {
            return tree;
        }
        
        return null;
    }
    

    // Handle deer eating trees
    processFeeding(trees) {
        // Just log the initial count once
        const youngTrees = trees.filter(tree => tree && tree.position !== 0 && tree.age <= 2).length;
        console.log(`DeerManager: Starting feeding cycle. Available young trees: ${youngTrees}`);
    
        this.deers.forEach((deer, deerIndex) => {
            if (!deer.isAlive()) return;
    
            let consumed = 0;
            let attempts = 0;
            let successfulFinds = 0;
            
            while (attempts < deer.stamina && !this.isSatisfied(consumed, deer.hunger)) {
                const youngTree = this.findYoungTree(trees);
                if (youngTree) {
                    consumed += youngTree.mass;
                    const treeIndex = trees.indexOf(youngTree);
                    if (treeIndex !== -1) {
                        trees[treeIndex] = new Tree(0, 0, 0, 0, 0);
                        successfulFinds++;
                    }
                }
                attempts++;
                
                // Only log every 100,000 attempts if still searching
                if (attempts % 100000 === 0) {
                    console.log(`DeerManager: Deer ${deerIndex} still searching - Found ${successfulFinds} trees in ${attempts} attempts`);
                }
            }
    
            // Only log the final outcome
            if (!this.isSatisfied(consumed, deer.hunger)) {
                console.log(`DeerManager: Deer ${deerIndex} died: found ${successfulFinds} trees, consumed ${consumed.toFixed(1)}/${deer.hunger} (${attempts} attempts)`);
                this.killDeer(deerIndex);
            }
        });
    
        // Log summary at end of feeding cycle
        const survivingDeer = this.deers.filter(deer => deer.isAlive()).length;
        console.log(`DeerManager: Feeding cycle complete. ${survivingDeer} deer survived`);
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