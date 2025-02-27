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
        // Base curve that peaks at age 4-5
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.5);
        
        // Directly use the staminaFactor (already 1-10 scale)
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
    reproduce(maturity, reproductionFactor = 5.0) {
        // Apply reproduction factor (5 is baseline)
        const scaledReproFactor = reproductionFactor / 5.0;
        
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        const matureWolves = aliveWolves.filter(wolf => wolf.age >= maturity);
        
        console.log("WolfManager: Processing reproduction with factor:", reproductionFactor);
        console.log(`WolfManager: Mature wolves: ${matureWolves.length}/${aliveWolves.length}`);
        
        // Ensure small packs get a reproduction boost
        const packSizeBoost = aliveWolves.length < 4 ? 2.0 : 1.0;
        
        // Base birth rate tracking
        let baseBirthRate = 0;
        
        // Calculate individual reproduction probability for each mature wolf
        matureWolves.forEach(wolf => {
            // Increase survival chance with smaller packs
            const individualProb = 
                0.25 * // Increased base rate 
                (1 - (aliveWolves.length / (this.wolves.length * 0.2))) * // Less density penalty
                (wolf.stamina / 10) * 
                scaledReproFactor *
                packSizeBoost; // Add boost for small packs
            
            if (Math.random() < individualProb) {
                baseBirthRate++;
            }
        });
        
        // Round to ensure we get whole wolves
        const newBirths = Math.max(0, Math.round(baseBirthRate));
        
        console.log(`WolfManager: ${newBirths} new wolves will be born (factor: ${reproductionFactor})`);
        
        // Create new wolves
        for (let i = 0; i < newBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("WolfManager: No more space for new wolves");
                break;
            }
            this.wolves[newPos] = new Wolf(newPos + 1, 0, 0, 0, 0);
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
            
            // Scale hunger based on hunger factor (5 is baseline)
            // A wolf with hungerFactor=5 needs about 0.6 of a deer's mass
            const massNeeded = wolf.hunger * (wolf.mass / 20);
            
            // Calculate hunting success - wolf's ability to find deer
            const huntingSuccess = this.calculateHuntingSuccess(
                wolf,
                remainingDeer.length,
                initialDeerCount
            );
            
            // Calculate how many deer the wolf has a chance to catch
            const minSuccessRate = Math.min(0.4, huntingSuccess); // At least 40% if possible
            const successRate = minSuccessRate + (Math.random() * (huntingSuccess - minSuccessRate));
            const deerFound = Math.max(1, Math.ceil(wolf.hunger * successRate));
            
            // Log the probability calculations
            const wolfCount = this.wolves.filter(w => w.isAlive()).length;
            console.log(`WolfManager: Wolf ${wolfIndex} hunting - success prob: ${huntingSuccess.toFixed(2)}, ` + 
                        `applied rate: ${successRate.toFixed(2)}, mass needed: ${massNeeded.toFixed(1)}, ` +
                        `deer found: ${deerFound}, stamina: ${wolf.stamina.toFixed(1)}, ` +
                        `age: ${wolf.age.toFixed(1)}, pack size: ${wolfCount}`);
            
            // Actual deer captured is limited
            const deerCaptured = Math.min(
                deerFound,
                2, // Wolves typically don't catch more than a couple deer at once
                remainingDeer.length // Can't catch more deer than available
            );
            
            // Calculate if wolf found enough food
            let massConsumed = 0;
            
            // Remove captured deer from environment
            for (let i = 0; i < deerCaptured && remainingDeer.length > 0; i++) {
                // Take a random deer from the remaining pool
                const randomIndex = Math.floor(Math.random() * remainingDeer.length);
                const capturedDeer = remainingDeer[randomIndex];
                
                // Remove from available pool
                remainingDeer.splice(randomIndex, 1);
                
                // Calculate how much of the deer the wolf actually consumes
                // Wolf takes what it needs, not the entire deer
                const massFromThisDeer = Math.min(capturedDeer.mass, massNeeded - massConsumed);
                
                // Remove from deer population (kill the deer)
                const deerIndex = deerManager.deers.indexOf(capturedDeer);
                if (deerIndex !== -1) {
                    deerManager.killDeer(deerIndex);
                    massConsumed += massFromThisDeer;
                    
                    // If wolf has enough food, stop hunting
                    if (massConsumed >= massNeeded) {
                        break;
                    }
                }
            }
            
            // Determine if wolf survives based on how much it ate compared to what it needed
            // Now needs 60% of its hunger satisfied to survive
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
        
        // Base probability depends on prey availability - more scarce = harder to find
        const availabilityFactor = Math.min(1.0, Math.sqrt(availableDeerCount / Math.max(1, initialDeerCount)));
        
        // Use stamina directly (from 0-10 scale)
        const staminaFactor = Math.min(1.0, wolf.stamina / 10);
        
        // Age factor - prime-age wolves have advantage
        const ageFactor = 1.0 - Math.abs(wolf.age - 4) / 8; // Peak at age 4
        
        // Pack dynamics - wolves hunt better in packs
        const wolfCount = this.wolves.filter(w => w.isAlive()).length;
        // Pack factor increases up to 1.5 for packs of 5+, but smaller packs have disadvantage
        const packFactor = Math.min(1.5, 0.7 + (wolfCount / 10));
        
        // Combined probability
        let probability = 
            (0.4 + 0.4 * availabilityFactor) * // Base chance + availability impact
            (0.6 + 0.4 * staminaFactor) *      // Stamina boost
            (0.7 + 0.3 * ageFactor) *          // Age modifier
            packFactor;                         // Pack bonus
        
        // Cap probability between 0 and 1
        return Math.max(0, Math.min(0.9, probability)); // Max 90% success
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

    
    // Update migration to use 1-10 scale
    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) return;
        
        // Scale migration factor where 5 is "normal"
        const packSizeBoost = this.getPopulationCount() < 3 ? 2.0 : 1.0;
        const scaledFactor = (migrationFactor / 5.0) * packSizeBoost;
        
        // Base migration rate lower than deer (predators are typically less abundant)
        const baseMigrants = Math.random() < 0.3 ? 1 : 0; // 30% chance of 1 wolf, 70% chance of none
        
        // Final number of migrants adjusted by the factor
        const migrantCount = Math.max(0, Math.round(baseMigrants * scaledFactor));
        
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
                tempWolf.hunger = age > 4 ? 5.0 : (age * 5.0 / 4.0); // Use 5 as baseline hunger
                tempWolf.stamina = this.calculateStamina(age, 5.0); // Use 5 as baseline stamina
                
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