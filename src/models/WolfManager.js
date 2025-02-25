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
        return staminaFactor * (13.26 * Math.exp(
            -Math.pow(age - 4.51, 2) / (2 * 3.28 * 3.28)
        ));
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
    reproduce(maturity) {
        console.log("WolfManager: Processing reproduction");
        const newBirths = this.wolves.reduce((count, wolf) => {
            if (wolf.age >= maturity && Math.random() < 0.5) {
                return count + 1;
            }
            return count;
        }, 0);

        console.log(`WolfManager: ${newBirths} new wolves will be born`);

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

    // Handle wolves hunting deer
    processHunting(deerManager) {
        console.log("WolfManager: Processing hunting");
        this.wolves.forEach((wolf, wolfIndex) => {
            if (!wolf.isAlive()) return;

            let consumed = 0;
            let attempts = 0;
            console.log(`Wolf ${wolfIndex} starting hunt. Stamina: ${wolf.stamina}, Hunger: ${wolf.hunger}`);

            // Use stamina as search attempts
            while (attempts < wolf.stamina && !this.isSatisfied(consumed, wolf.hunger)) {
                const randomIndex = Math.floor(Math.random() * deerManager.deers.length);
                const deer = deerManager.deers[randomIndex];
                
                if (deer && deer.isAlive()) {
                    consumed += deer.mass;
                    deerManager.killDeer(randomIndex);
                    console.log(`Wolf ${wolfIndex} caught deer at position ${randomIndex}. Total consumed: ${consumed}`);
                }
                
                attempts++;
            }

            if (!this.isSatisfied(consumed, wolf.hunger)) {
                console.log(`Wolf ${wolfIndex} died from starvation: consumed ${consumed}/${wolf.hunger} after ${attempts} attempts`);
                this.killWolf(wolfIndex);
            }
        });
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