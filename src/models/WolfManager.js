// models/WolfManager.js
import { Wolf } from './classes';
import { Utils } from '../utils/helpers';

class WolfManager {
    constructor() {
        this.wolves = [];
    }

    // Initialize wolf population
    initialize(populationSize, arraySize, staminaFactor, hunger) {
        console.log("WolfManager: Starting initialization...", {
            populationSize,
            arraySize,
            staminaFactor,
            hunger
        });
        
        // Initialize wolves array with empty wolves
        this.wolves = new Array(arraySize).fill(null).map(() => new Wolf(0, 0, 0, 0, 0));
        
        let successfulInitCount = 0;
        for (let i = 0; i < populationSize; i++) {
            let newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.warn(`WolfManager: No more space available at position ${i}`);
                break;
            }

            const age = Utils.randGauss(8, 3);
            const tempWolf = new Wolf(newPos + 1, age, 0, 0, 0);
            
            // Calculate properties based on age
            tempWolf.mass = age > 4 ? 28 : age * 7;
            tempWolf.hunger = age > 4 ? hunger : (age * hunger / 4.0);
            tempWolf.stamina = this.calculateStamina(age, staminaFactor);

            this.wolves[newPos] = tempWolf;
            successfulInitCount++;
            
            console.log(`WolfManager: Created wolf ${i} at position ${newPos}:`, {
                age: tempWolf.age,
                mass: tempWolf.mass,
                hunger: tempWolf.hunger,
                stamina: tempWolf.stamina
            });
        }
        
        console.log(`WolfManager: Initialization complete. Created ${successfulInitCount}/${populationSize} wolves`);
    }

    

    // Helper method to calculate stamina
    calculateStamina(age, staminaFactor) {
        // New method using a 0-10 scale directly
        
        // Base curve that peaks at age 4-5
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.5);
        
        // Apply the staminaFactor as a direct multiplier
        return Math.min(10, baseCurve * (staminaFactor / 5));
    }

    // Find empty position for new wolf
    findEmptyPosition() {
        const maxAttempts = this.wolves.length * 2;
        let attempts = 0;
    
        while (attempts < maxAttempts) {
            const emptyPositions = this.wolves
                .map((wolf, index) => wolf.nr === 0 ? index : -1)
                .filter(index => index !== -1);
            
            if (emptyPositions.length === 0) {
                console.log("WolfManager: No empty positions available in array of size", this.wolves.length);
                return -1;
            }
    
            const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            if (position < this.wolves.length) {
                return position;
            }
    
            attempts++;
        }
    
        console.log("WolfManager: Could not find valid position after", maxAttempts, "attempts");
        return -1;
    }
    // Simulate growing process for all wolves
    grow(staminaFactor, hunger) {
        console.log("WolfManager: Processing growth for all wolves");
        this.wolves.forEach((wolf, index) => {
            if (wolf.isAlive()) {
                wolf.age += 1;
                wolf.mass = wolf.age > 4 ? 28 : wolf.age * 7;
                wolf.hunger = wolf.age > 4 ? hunger : (wolf.age * hunger / 4);
                wolf.stamina = this.calculateStamina(wolf.age, staminaFactor);
                console.log(`WolfManager: Wolf ${index} grew. New stats:`, {
                    age: wolf.age,
                    mass: wolf.mass,
                    hunger: wolf.hunger,
                    stamina: wolf.stamina
                });
            }
        });
    }

    // Handle wolf death
    killWolf(index) {
        if (index >= 0 && index < this.wolves.length) {
            console.log(`WolfManager: Killing wolf at index ${index}`);
            this.wolves[index] = new Wolf(0, 0, 0, 0, 0);
        }
    }

    // Create new wolf births
    reproduce(maturity, reproductionFactor = 1.0) {
        console.log("WolfManager: Processing reproduction with factor:", reproductionFactor);
        
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        const matureWolves = aliveWolves.filter(wolf => wolf.age >= maturity);
        
        // Apply reproduction factor to control birth rates
        const baseBirthRate = matureWolves.reduce((count, wolf) => {
            if (Math.random() < 0.5) {
                return count + 1;
            }
            return count;
        }, 0);
        
        // Apply the reproduction factor
        const newBirths = Math.floor(baseBirthRate * reproductionFactor);
    
        console.log(`WolfManager: ${newBirths} new wolves will be born (base: ${baseBirthRate}, factor: ${reproductionFactor})`);
    
        for (let i = 0; i < newBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("WolfManager: No more space for new wolves");
                break;
            }
            this.wolves[newPos] = new Wolf(newPos, 0, 0, 0, 0);
            console.log(`WolfManager: New wolf born at position ${newPos}`);
        }
    }

    // Handle natural deaths due to age
    processNaturalDeaths() {
        console.log("WolfManager: Processing natural deaths");
        this.wolves.forEach((wolf, index) => {
            if (wolf.isAlive()) {
                const deathAge = Utils.randGauss(10.0, 5);
                if (wolf.age > deathAge) {
                    console.log(`WolfManager: Wolf ${index} died of old age at ${wolf.age} years`);
                    this.killWolf(index);
                }
            }
        });
    }

    processHunting(deerManager) {
        console.log("WolfManager: Processing hunting");
        
        // Get all available deer
        const availableDeer = deerManager.deers.filter(deer => deer.isAlive());
        const initialDeerCount = availableDeer.length;
        
        console.log(`WolfManager: Starting hunting cycle. Available deer: ${initialDeerCount}`);
        
        if (initialDeerCount === 0) {
            // Special handling for no deer - make some wolves survive anyway
            const wolves = this.wolves.filter(wolf => wolf.isAlive());
            // Let younger wolves with better stamina survive
            const survivingWolves = wolves
                .map((wolf, index) => ({ wolf, index }))
                .sort((a, b) => (a.wolf.age < 3 ? -1 : 1)) // Prioritize young wolves
                .slice(0, Math.max(1, Math.floor(wolves.length * 0.3))); // 30% survival rate
                
            // Mark the rest as dead
            this.wolves.forEach((wolf, index) => {
                if (wolf.isAlive() && !survivingWolves.some(w => w.index === index)) {
                    console.log(`WolfManager: Wolf ${index} died: No deer available in ecosystem`);
                    this.killWolf(index);
                }
            });
            
            console.log(`WolfManager: Hunting cycle complete. ${survivingWolves.length}/${wolves.length} wolves survived despite no deer`);
            return;
        }
        
        // Make a copy of the available deer to track which ones remain
        let remainingDeer = [...availableDeer];
        
        // Sort wolves by stamina (stronger wolves hunt first)
        const sortedWolfIndices = this.wolves
            .map((wolf, index) => ({ wolf, index }))
            .filter(item => item.wolf.isAlive())
            .sort((a, b) => b.wolf.stamina - a.wolf.stamina)
            .map(item => item.index);
        
        for (const wolfIndex of sortedWolfIndices) {
            const wolf = this.wolves[wolfIndex];
            
            // No deer left means the wolf has no chance to find food
            if (remainingDeer.length === 0) {
                console.log(`WolfManager: Wolf ${wolfIndex} died: No deer remain`);
                this.killWolf(wolfIndex);
                continue;
            }
            
            // Calculate how many deer this wolf needs based on hunger
            const avgDeerMass = remainingDeer.reduce((sum, d) => sum + d.mass, 0) / remainingDeer.length;
            const deerNeededForHunger = Math.ceil(wolf.hunger / avgDeerMass);
            
            // Calculate hunting success - wolf's ability to find deer
            const huntingSuccess = this.calculateHuntingSuccess(
                wolf,
                remainingDeer.length,
                initialDeerCount
            );
            
            // Calculate how many deer the wolf actually catches - more generous approach
            // Use a minimum success rate to avoid complete failure when huntingSuccess is decent
            const minSuccessRate = Math.min(0.4, huntingSuccess); // At least 40% if possible
            const successRate = minSuccessRate + (Math.random() * (huntingSuccess - minSuccessRate));
            const deerFound = Math.max(1, Math.ceil(deerNeededForHunger * successRate));
            
            // Log the probability calculations
            const wolfCount = this.wolves.filter(w => w.isAlive()).length;
            console.log(`WolfManager: Wolf ${wolfIndex} hunting - success prob: ${huntingSuccess.toFixed(2)}, ` + 
                       `applied rate: ${successRate.toFixed(2)}, deer needed: ${deerNeededForHunger}, ` +
                       `deer found: ${deerFound}, stamina: ${wolf.stamina.toFixed(1)}, ` +
                       `age: ${wolf.age.toFixed(1)}, pack size: ${wolfCount}`);
            
            // Actual deer captured is limited by what's available
            const deerCaptured = Math.min(
                deerFound,
                2, // Wolves typically don't catch more than a couple deer at once
                remainingDeer.length // Can't catch more deer than available
            );
            
            // Calculate if wolf found enough food
            const massNeeded = wolf.hunger;
            let massConsumed = 0;
            
            // Remove captured deer from environment
            for (let i = 0; i < deerCaptured && remainingDeer.length > 0; i++) {
                // Take a random deer from the remaining pool
                const randomIndex = Math.floor(Math.random() * remainingDeer.length);
                const capturedDeer = remainingDeer[randomIndex];
                
                // Remove from available pool
                remainingDeer.splice(randomIndex, 1);
                
                // Remove from deer population (kill the deer)
                const deerIndex = deerManager.deers.indexOf(capturedDeer);
                if (deerIndex !== -1) {
                    deerManager.killDeer(deerIndex);
                    massConsumed += capturedDeer.mass;
                }
            }
            
            // Determine if wolf survives based on how much it ate compared to what it needed
            // More lenient - now only needs 60% of its hunger satisfied to survive
            if (massConsumed >= massNeeded * 0.6) {
                console.log(`WolfManager: Wolf ${wolfIndex} survived: caught ${deerCaptured} deer (${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass)`);
            } else {
                console.log(`WolfManager: Wolf ${wolfIndex} died: found only ${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass needed`);
                this.killWolf(wolfIndex);
            }
        }
        
        const survivingWolves = this.wolves.filter(wolf => wolf.isAlive()).length;
        console.log(`WolfManager: Hunting cycle complete. ${survivingWolves}/${sortedWolfIndices.length} wolves survived`);
    }
    
    // Helper method to calculate hunting success (ability to catch prey)
    calculateHuntingSuccess(wolf, availableDeerCount, initialDeerCount) {
        // No deer means no chance of finding food
        if (availableDeerCount === 0) return 0;
        
        // Base probability depends on prey availability
        const availabilityFactor = availableDeerCount / Math.max(1, initialDeerCount);
        
        // Use stamina directly (assuming 0-10 scale from control panel)
        // Handle the transition period when stamina values might still be large
        const staminaFactor = (wolf.stamina > 100) ? 
            Math.min(1.0, wolf.stamina / 300) : // For old large values (transition period)
            Math.min(1.0, wolf.stamina / 10);   // For new 0-10 scale
        
        // Age factor - prime-age wolves have advantage
        const ageFactor = 1.0 - Math.abs(wolf.age - 4) / 8; // Peak at age 4
        
        // Pack dynamics - wolves hunt better in packs
        const wolfCount = this.wolves.filter(w => w.isAlive()).length;
        const packFactor = Math.min(1.5, 0.7 + (wolfCount / 5)); // Max 50% bonus for packs of 5+
        
        // Combined probability - higher base success rate to improve survival
        let probability = 
            (0.5 + 0.4 * availabilityFactor) * // Higher base chance + availability impact
            (0.7 + 0.3 * staminaFactor) *      // Stamina boost
            (0.7 + 0.3 * ageFactor) *          // Age modifier
            packFactor;                         // Pack bonus
        
        // Cap probability between 0 and 1
        return Math.max(0, Math.min(1, probability));
    }
    

    // Helper method to find prey
    findPrey(deers) {
        const randomPosition = Math.floor(Math.random() * deers.length);
        const deer = deers[randomPosition];
        if (deer && deer.isAlive()) {
            return deer;
        }
        return null;
    }

    // Helper method to check if wolf is satisfied
    isSatisfied(consumed, hunger) {
        return consumed > hunger;
    }

    getPopulationCount() {
        return this.wolves.filter(wolf => wolf && wolf.isAlive()).length;
    }
    
    // Get detailed population statistics
    getStatistics() {
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        const stats = {
            total: aliveWolves.length,
            averageAge: aliveWolves.reduce((sum, wolf) => sum + wolf.age, 0) / aliveWolves.length || 0,
            averageStamina: aliveWolves.reduce((sum, wolf) => sum + wolf.stamina, 0) / aliveWolves.length || 0
        };
        
        console.log(`Wolf Statistics: Population=${stats.total}, Avg Age=${stats.averageAge.toFixed(1)}, Avg Stamina=${stats.averageStamina.toFixed(1)}`);
        
        return stats;
    }
    
    

    // Helper method to get age distribution
    getAgeDistribution(aliveWolves) {
        const distribution = {};
        aliveWolves.forEach(wolf => {
            distribution[wolf.age] = (distribution[wolf.age] || 0) + 1;
        });
        return distribution;
    }

    // Calculate approximate pack size
    calculatePackSize() {
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        return Math.ceil(aliveWolves.length / 8);
    }

    
    // Process random migration of wolves into the ecosystem
    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) return;
        
        // Base migration rate lower than deer (predators are typically less abundant)
        const baseMigrants = Math.random() < 0.7 ? 1 : 0; // 70% chance of 1 wolf, 30% chance of none
        
        // Final number of migrants adjusted by the factor
        const migrantCount = Math.max(0, Math.round(baseMigrants * migrationFactor));
        
        if (migrantCount > 0) {
            console.log(`WolfManager: ${migrantCount} wolves migrating into the ecosystem`);
            
            let successfulMigrants = 0;
            for (let i = 0; i < migrantCount; i++) {
                let newPos = this.findEmptyPosition();
                if (newPos === -1) {
                    console.warn("WolfManager: No space available for migrating wolves");
                    break;
                }
                
                // Create a mature wolf with reasonable stats
                const age = Utils.randGauss(3, 1);  // Young adult wolf
                const tempWolf = new Wolf(newPos + 1, age, 0, 0, 0);
                
                // Calculate properties based on age
                tempWolf.mass = age > 4 ? 28 : age * 7;
                tempWolf.hunger = age > 4 ? 1.0 : (age * 1.0 / 4.0);
                tempWolf.stamina = this.calculateStamina(age, 300.0); // Fixed stamina factor for migrants
                
                this.wolves[newPos] = tempWolf;
                successfulMigrants++;
            }
            
            if (successfulMigrants > 0) {
                console.log(`WolfManager: ${successfulMigrants} wolves successfully migrated into the ecosystem`);
            }
        }
    }

    // Debug method to show wolf details
    debugWolf(index) {
        const wolf = this.wolves[index];
        if (!wolf) return null;
        
        return {
            number: wolf.nr,
            age: wolf.age,
            mass: wolf.mass,
            hunger: wolf.hunger,
            stamina: wolf.stamina
        };
    }
}

export { WolfManager };