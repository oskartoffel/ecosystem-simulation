// models/WolfManager.js
import { Wolf } from './classes';
import { Utils } from '../utils/helpers';

/**
 * WolfManager handles all wolf lifecycle operations including:
 * - Initialization and population management
 * - Growth and aging
 * - Reproduction
 * - Death (age, starvation)
 * - Hunting behavior (predation of deer)
 * - Migration
 */
class WolfManager {
    constructor() {
        this.wolves = [];
        // Death tracking
        this.ageDeath = 0;
        this.starvationDeath = 0;
        this.unknownDeath = 0;
    }

    /**
     * Initialize wolf population
     * @param {number} populationSize - Initial wolf population
     * @param {number} arraySize - Size of the wolf array
     * @param {number} staminaFactor - Factor affecting wolf stamina (1-10 scale)
     * @param {number} hunger - Hunger factor (1-10 scale)
     */
    initialize(populationSize, arraySize, staminaFactor, hunger) {
        console.log(`LOUP: Starting initialization with population=${populationSize}, stamina=${staminaFactor}, hunger=${hunger}`);
        
        // Initialize wolves array with empty wolves
        this.wolves = new Array(arraySize).fill(null).map(() => new Wolf(0, 0, 0, 0, 0));
        
        let successfulInitCount = 0;
        for (let i = 0; i < populationSize; i++) {
            let newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.warn(`LOUP: No more space available at position ${i}`);
                break;
            }

            // Create age-distributed population (normal distribution)
            const age = Utils.randGauss(8, 3);  // Random age with normal distribution
            const tempWolf = new Wolf(newPos + 1, age, 0, 0, 0);
            
            // Calculate properties based on age
            tempWolf.mass = age > 4 ? 28 : age * 7;
            tempWolf.hunger = age > 4 ? hunger : (age * hunger / 4.0);
            tempWolf.stamina = this.calculateStamina(age, staminaFactor);

            this.wolves[newPos] = tempWolf;
            successfulInitCount++;
            
            console.log(`LOUP: Created wolf ${i} at position ${newPos}: age=${tempWolf.age.toFixed(1)}, mass=${tempWolf.mass.toFixed(1)}, stamina=${tempWolf.stamina.toFixed(1)}`);
        }
        
        console.log(`LOUP: Initialization complete. Created ${successfulInitCount}/${populationSize} wolves`);
    }

    /**
     * Calculate wolf stamina based on age and stamina factor
     * @param {number} age - Wolf age
     * @param {number} staminaFactor - Stamina factor (1-10 scale)
     * @returns {number} - Calculated stamina value
     */
    calculateStamina(age, staminaFactor) {
        // Normalize staminaFactor to 1-10 scale
        const normalizedFactor = Math.min(10, Math.max(1, staminaFactor));
        
        // Apply non-linear scaling (1=very weak, 5=normal, 10=very strong)
        const scaledFactor = Math.pow(normalizedFactor / 5.0, 1.5);
        
        // Base curve that peaks at age 4-5 (prime age for wolves)
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.5);
        
        // Apply stamina factor with non-linear impact
        return Math.min(10, baseCurve * scaledFactor);
    }

    /**
     * Find an empty position in the wolf array
     * @returns {number} - Index of empty position or -1 if none available
     */
    findEmptyPosition() {
        const maxAttempts = this.wolves.length * 2;  // Prevent infinite loops
        let attempts = 0;
    
        while (attempts < maxAttempts) {
            const emptyPositions = this.wolves
                .map((wolf, index) => wolf.nr === 0 ? index : -1)
                .filter(index => index !== -1);
            
            if (emptyPositions.length === 0) {
                console.log("LOUP: No empty positions available in array");
                return -1;
            }
    
            const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            if (position < this.wolves.length) {
                return position;
            }
    
            attempts++;
        }
    
        console.log("LOUP: Could not find valid position after", maxAttempts, "attempts");
        return -1;
    }

    /**
     * Simulate growing process for all wolves
     * @param {number} staminaFactor - Stamina factor (1-10 scale)
     * @param {number} hunger - Hunger factor (1-10 scale)
     */
    grow(staminaFactor, hunger) {
        const initialCount = this.getPopulationCount();
        console.log(`LOUP: Growing wolf population (${initialCount} wolves)`);
        
        this.wolves.forEach((wolf, index) => {
            if (wolf.isAlive()) {
                // Store original values for logging
                const oldAge = wolf.age;
                const oldStamina = wolf.stamina;
                
                // Update age and recalculate properties
                wolf.age += 1;
                wolf.mass = wolf.age > 4 ? 28 : wolf.age * 7;
                wolf.hunger = wolf.age > 4 ? hunger : (wolf.age * hunger / 4);
                wolf.stamina = this.calculateStamina(wolf.age, staminaFactor);
                
                // Only log a sample of wolves to avoid excessive logs
                if (Math.random() < 0.2 || index < 5) { // 20% sample or first 5 wolves
                    console.log(`LOUP: Wolf ${index} grew from age ${oldAge.toFixed(1)} to ${wolf.age.toFixed(1)}, stamina ${oldStamina.toFixed(1)} to ${wolf.stamina.toFixed(1)}`);
                }
            }
        });
        
        console.log(`LOUP: Growth complete for wolf population`);
    }

    /**
     * Kill a wolf at the specified index
     * @param {number} index - Index of wolf to kill
     * @param {string} cause - Cause of death for tracking
     */
    killWolf(index, cause = 'unknown') {
        if (index >= 0 && index < this.wolves.length && this.wolves[index].isAlive()) {
            const age = this.wolves[index].age;
            
            // Create a new empty wolf
            this.wolves[index] = new Wolf(0, 0, 0, 0, 0);
            
            // Track specific causes of death
            if (cause === 'age') {
                this.ageDeath++;
                console.log(`LOUP: Wolf at position ${index} died of old age (${age.toFixed(1)} years)`);
            } else if (cause === 'starvation') {
                this.starvationDeath++;
                console.log(`LOUP: Wolf at position ${index} died of starvation`);
            } else {
                this.unknownDeath++;
                console.log(`LOUP: Wolf at position ${index} died (cause: ${cause})`);
            }
        }
    }

    /**
     * Create new wolf births
     * @param {number} maturity - Age at which wolves can reproduce
     * @param {number} reproductionFactor - Factor affecting reproduction rate (1-10 scale)
     */
    reproduce(maturity, reproductionFactor = 5.0) {
        // Apply reproduction factor (5 is baseline)
        // Scale with non-linear impact for wider range (1=very low, 5=normal, 10=very high)
        const scaledReproFactor = Math.pow(reproductionFactor / 5.0, 1.8);
        
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        const matureWolves = aliveWolves.filter(wolf => wolf.age >= maturity);
        
        console.log(`LOUP: Reproduction - ${matureWolves.length}/${aliveWolves.length} mature wolves, factor=${reproductionFactor} (${scaledReproFactor.toFixed(2)} scaled)`);
        
        // Ensure small packs get a reproduction boost (ecological reality)
        const packSizeBoost = aliveWolves.length < 4 ? 2.0 : 1.0;
        
        // Base birth rate tracking
        let potentialBirths = 0;
        
        // Calculate individual reproduction probability for each mature wolf
        matureWolves.forEach(wolf => {
            // Population density impact
            const populationDensity = aliveWolves.length / this.wolves.length;
            
            // Increase reproduction chance with smaller packs
            const individualProb = 
                0.3 * // Base probability 
                (1 - (populationDensity * 0.5)) * // Less density penalty
                (wolf.stamina / 10) * 
                scaledReproFactor *
                packSizeBoost; // Add boost for small packs
            
            // Log a sample of reproduction chances
            if (Math.random() < 0.2) { // 20% sample
                console.log(`LOUP: Wolf reproduction chance: ${(individualProb * 100).toFixed(2)}% (age: ${wolf.age.toFixed(1)}, stamina: ${wolf.stamina.toFixed(1)})`);
            }
            
            if (Math.random() < individualProb) {
                potentialBirths++;
            }
        });
        
        // Round to ensure we get whole wolves
        const newBirths = Math.max(0, Math.round(potentialBirths));
        
        console.log(`LOUP: ${newBirths} new wolves will be born`);
        
        // Create new wolves
        let actualBirths = 0;
        for (let i = 0; i < newBirths; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("LOUP: No more space for new wolves");
                break;
            }
            // New wolves start at age 0
            const newWolf = new Wolf(newPos + 1, 0, 0, 0, 0);
            newWolf.mass = 7; // Pup mass
            newWolf.hunger = 0.25; // Pups need less food
            newWolf.stamina = 10; // Pups are energetic but not strong hunters
            
            this.wolves[newPos] = newWolf;
            actualBirths++;
            console.log(`LOUP: New wolf born at position ${newPos}`);
        }
        
        if (actualBirths > 0) {
            console.log(`LOUP: ${actualBirths} wolf pups joined the pack`);
        }
    }

    /**
     * Handle natural deaths due to age
     */
    processNaturalDeaths() {
        console.log("LOUP: Processing natural deaths");
        let deathCount = 0;
        
        this.wolves.forEach((wolf, index) => {
            if (wolf.isAlive()) {
                // Wolves have variable lifespans
                const deathAge = Utils.randGauss(10.0, 5);
                if (wolf.age > deathAge) {
                    this.killWolf(index, 'age');
                    deathCount++;
                }
            }
        });
        
        console.log(`LOUP: ${deathCount} wolves died of natural causes`);
    }

    /**
     * Process hunting for all wolves
     * @param {DeerManager} deerManager - DeerManager instance for deer interaction
     */
    processHunting(deerManager) {
        console.log("LOUP: Processing hunting");
        
        // Get all available deer
        const availableDeer = deerManager.deers.filter(deer => deer.isAlive());
        const initialDeerCount = availableDeer.length;
        
        console.log(`LOUP: Starting hunting cycle. Available deer: ${initialDeerCount}`);
        
        // Handle special case: no deer in ecosystem
        if (initialDeerCount === 0) {
            // Special handling for no deer - make some wolves survive anyway
            const wolves = this.wolves.filter(wolf => wolf.isAlive());
            // Let younger wolves with better stamina survive
            const survivingWolves = wolves
                .map((wolf, index) => ({ wolf, index: this.wolves.indexOf(wolf) }))
                .sort((a, b) => (a.wolf.age < 3 ? -1 : 1)) // Prioritize young wolves
                .slice(0, Math.max(1, Math.floor(wolves.length * 0.3))); // 30% survival rate
                
            // Mark the rest as dead
            this.wolves.forEach((wolf, index) => {
                if (wolf.isAlive() && !survivingWolves.some(w => w.index === index)) {
                    console.log(`LOUP: Wolf ${index} died: No deer available in ecosystem`);
                    this.killWolf(index, 'starvation');
                }
            });
            
            console.log(`LOUP: Hunting cycle complete. ${survivingWolves.length}/${wolves.length} wolves survived despite no deer`);
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
        
        // Count survival statistics
        let totalWolvesSurvived = 0;
        let totalWolvesStarved = 0;
        let totalDeerKilled = 0;
        
        for (const wolfIndex of sortedWolfIndices) {
            const wolf = this.wolves[wolfIndex];
            
            // No deer left means the wolf has no chance to find food
            if (remainingDeer.length === 0) {
                console.log(`LOUP: Wolf ${wolfIndex} found no deer remaining`);
                this.killWolf(wolfIndex, 'starvation');
                totalWolvesStarved++;
                continue;
            }
            
            // Scale hunger based on hunger factor
            // More realistic calculation: larger/older wolves need more food
            const massNeeded = wolf.hunger * (wolf.mass / 30);
            
            // Calculate hunting success - wolf's ability to find deer
            const huntingSuccess = this.calculateHuntingSuccess(
                wolf,
                remainingDeer.length,
                initialDeerCount
            );
            
            // Calculate how many deer the wolf has a chance to catch
            // Add some randomness to hunting success
            const minSuccessRate = Math.min(0.4, huntingSuccess); // At least 40% if possible
            const successRate = minSuccessRate + (Math.random() * (huntingSuccess - minSuccessRate));
            
            // Number of deer a wolf can find depends on hunger
            const deerFound = Math.max(1, Math.ceil(wolf.hunger * successRate));
            
            // Pack bonus for hunting (wolves hunt better in packs)
            const wolfCount = this.wolves.filter(w => w.isAlive()).length;
            const packBonus = Math.min(1.5, 0.7 + (wolfCount / 10));
            
            // Log the probability calculations
            console.log(`LOUP: Wolf ${wolfIndex} hunting - success prob: ${huntingSuccess.toFixed(2)}, ` + 
                        `success rate: ${successRate.toFixed(2)}, ` + 
                        `mass needed: ${massNeeded.toFixed(1)}, ` +
                        `deer found: ${deerFound}, ` +
                        `stamina: ${wolf.stamina.toFixed(1)}, ` +
                        `age: ${wolf.age.toFixed(1)}, ` +
                        `pack size: ${wolfCount}, pack bonus: ${packBonus.toFixed(1)}`);
            
            // Actual deer captured is limited
            const deerCaptured = Math.min(
                deerFound,
                2, // Wolves typically don't catch more than a couple deer at once
                remainingDeer.length // Can't catch more deer than available
            );
            
            // Calculate if wolf found enough food
            let massConsumed = 0;
            let deerIndicesKilled = [];
            
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
                    // Save the deer index so we can kill it later
                    deerIndicesKilled.push(deerIndex);
                    
                    // Add mass to what the wolf consumed
                    massConsumed += massFromThisDeer;
                    totalDeerKilled++;
                    
                    // If wolf has enough food, stop hunting
                    if (massConsumed >= massNeeded) {
                        break;
                    }
                }
            }
            
            // Kill all deer that were hunted
            deerIndicesKilled.forEach(deerIndex => {
                deerManager.killDeer(deerIndex, 'predation');
            });
            
            // Determine if wolf survives based on how much it ate compared to what it needed
            // Now needs 60% of its hunger satisfied to survive
            if (massConsumed >= massNeeded * 0.6) {
                console.log(`LOUP: Wolf ${wolfIndex} survived: caught ${deerIndicesKilled.length} deer (${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass)`);
                totalWolvesSurvived++;
            } else {
                console.log(`LOUP: Wolf ${wolfIndex} starved: found only ${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass needed`);
                this.killWolf(wolfIndex, 'starvation');
                totalWolvesStarved++;
            }
        }
        
        console.log(`LOUP: Hunting cycle complete. ${totalWolvesSurvived}/${sortedWolfIndices.length} wolves survived, ${totalWolvesStarved} starved, ${totalDeerKilled} deer killed`);
    }
    
    /**
     * Calculate hunting success (ability to catch prey)
     * @param {Wolf} wolf - Wolf attempting to hunt
     * @param {number} availableDeerCount - Number of available deer
     * @param {number} initialDeerCount - Initial number of deer
     * @returns {number} - Probability of successful hunting
     */
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

    /**
     * Process migration of new wolves into ecosystem
     * @param {number} migrationFactor - Factor affecting migration rate (1-10 scale)
     */
    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) return;
        
        // Scale migration factor where 5 is "normal"
        // Apply non-linear scaling for wider impact range
        const packSizeBoost = this.getPopulationCount() < 3 ? 2.0 : 1.0;
        const scaledFactor = Math.pow(migrationFactor / 5.0, 1.5) * packSizeBoost;
        
        // Base migration rate lower than deer (predators are typically less abundant)
        const baseMigrants = Math.random() < 0.3 ? 1 : 0; // 30% chance of 1 wolf, 70% chance of none
        
        // Final number of migrants adjusted by the factor
        const migrantCount = Math.max(0, Math.round(baseMigrants * scaledFactor));
        
        if (migrantCount > 0) {
            console.log(`LOUP: ${migrantCount} wolves migrating into the ecosystem (factor=${migrationFactor})`);
            
            let successfulMigrants = 0;
            for (let i = 0; i < migrantCount; i++) {
                let newPos = this.findEmptyPosition();
                if (newPos === -1) {
                    console.warn("LOUP: No space available for migrating wolves");
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
                console.log(`LOUP: ${successfulMigrants} wolves successfully migrated into the ecosystem`);
            }
        }
    }

    /**
     * Get current wolf population count
     * @returns {number} - Number of living wolves
     */
    getPopulationCount() {
        return this.wolves.filter(wolf => wolf && wolf.isAlive()).length;
    }

    /**
     * Get detailed population statistics
     * @returns {Object} - Statistics about the wolf population
     */
    getStatistics() {
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        
        const stats = {
            total: aliveWolves.length,
            averageAge: aliveWolves.reduce((sum, wolf) => sum + wolf.age, 0) / aliveWolves.length || 0,
            averageStamina: aliveWolves.reduce((sum, wolf) => sum + wolf.stamina, 0) / aliveWolves.length || 0,
            ageDeaths: this.ageDeath,
            starvationDeaths: this.starvationDeath,
            unknownDeaths: this.unknownDeath,
            ageDistribution: this.getAgeDistribution(aliveWolves)
        };
        
        console.log(`LOUP: Statistics - Population=${stats.total}, Avg Age=${stats.averageAge.toFixed(1)}, Avg Stamina=${stats.averageStamina.toFixed(1)}, Deaths: Age=${this.ageDeath}, Starvation=${this.starvationDeath}, Unknown=${this.unknownDeath}`);
        
        return stats;
    }

    /**
     * Get age distribution of wolf population
     * @param {Array} aliveWolves - Array of living wolves
     * @returns {Object} - Age distribution
     */
    getAgeDistribution(aliveWolves) {
        const distribution = {};
        aliveWolves.forEach(wolf => {
            const ageKey = Math.floor(wolf.age);
            distribution[ageKey] = (distribution[ageKey] || 0) + 1;
        });
        return distribution;
    }

    /**
     * Calculate approximate pack size
     * @returns {number} - Approximate number of packs
     */
    calculatePackSize() {
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        return Math.ceil(aliveWolves.length / 8); // Assuming about 8 wolves per pack
    }

    /**
     * Debug method to show wolf details
     * @param {number} index - Index of wolf to debug
     * @returns {Object|null} - Wolf details or null if not found
     */
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