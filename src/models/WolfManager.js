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
        
        // Statistics tracking for enhanced UI
        this.migrationCount = 0;
        this.reproductionCount = 0;
        this.huntingSuccessTotal = 0;
        this.huntingAttempts = 0;
        this.totalPreyKilled = 0;
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
        
        // Reset death counters
        this.ageDeath = 0;
        this.starvationDeath = 0;
        this.unknownDeath = 0;
        
        let successfulInitCount = 0;
        for (let i = 0; i < populationSize; i++) {
            let newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.warn(`LOUP: No more space available at position ${i}`);
                break;
            }

            // Create age-distributed population (normal distribution)
            const age = Utils.randGauss(6, 2);  // Adjusted to more reasonable age distribution
            const tempWolf = new Wolf(newPos + 1, age, 0, 0, 0);
            
            // Calculate properties based on age
            tempWolf.mass = age > 4 ? 28 : age * 7;
            tempWolf.hunger = age > 4 ? hunger : (age * hunger / 4.0);
            tempWolf.stamina = this.calculateStamina(age, staminaFactor);

            this.wolves[newPos] = tempWolf;
            successfulInitCount++;
            
            console.log(`LOUP: Created wolf ${i} at position ${newPos}: age=${tempWolf.age.toFixed(1)}, mass=${tempWolf.mass.toFixed(1)}, stamina=${tempWolf.stamina.toFixed(1)}, hunger=${tempWolf.hunger.toFixed(1)}`);
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
        // More impact from the stamina factor
        const scaledFactor = Math.pow(normalizedFactor / 5.0, 1.7);
        
        // Base curve that peaks at age 4-5 (prime age for wolves)
        // Steeper decline for very young and old wolves
        const baseCurve = Math.max(0, 10 - Math.pow(age - 4.5, 2) / 2.2);
        
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
                    console.log(`LOUP: Wolf ${index} grew from age ${oldAge.toFixed(1)} to ${wolf.age.toFixed(1)}, stamina ${oldStamina.toFixed(1)} to ${wolf.stamina.toFixed(1)}, hunger=${wolf.hunger.toFixed(1)}`);
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
        // Scale with adjusted non-linear impact for more balanced reproduction
        const scaledReproFactor = Math.pow(reproductionFactor / 5.0, 1.6);
        
        const aliveWolves = this.wolves.filter(wolf => wolf.isAlive());
        const matureWolves = aliveWolves.filter(wolf => wolf.age >= maturity);
        
        console.log(`LOUP: Reproduction - ${matureWolves.length}/${aliveWolves.length} mature wolves, factor=${reproductionFactor} (${scaledReproFactor.toFixed(2)} scaled)`);
        
        // Ensure small packs get a reproduction boost (ecological reality)
        const packSizeBoost = aliveWolves.length < 4 ? 2.0 : 1.0;
        
        // Stronger boost for middle reproduction factors (addressing feedback)
        const middleBoost = (reproductionFactor >= 4 && reproductionFactor <= 6) ? 1.3 : 1.0;
        
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
                packSizeBoost * // Add boost for small packs
                middleBoost;   // Add boost for middle reproduction factors
            
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
            // Add this line to track reproduction:
            this.reproductionCount += actualBirths;
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
                // Rebalanced wolf lifespan distribution
                // Mean of 9 years with wider variation (SD of 4)
                // This creates a more natural mortality curve
                const deathAge = Utils.randGauss(9.0, 4.0);
                
                // Base death probability increases significantly with age
                let deathProbability = 0;
                
                if (wolf.age <= 2) {
                    // Very young wolves (pups) have moderate mortality (but not for "old age" reasons)
                    deathProbability = 0.15;
                } else if (wolf.age <= 4) {
                    // Young adult wolves have lower mortality
                    deathProbability = 0.08;
                } else if (wolf.age > deathAge) {
                    // Wolves beyond their natural lifespan have very high mortality
                    deathProbability = 0.8;
                } else {
                    // Increasing probability as wolves age (but not yet past deathAge)
                    // Mortality increases more sharply as wolves approach typical death age
                    deathProbability = Math.min(0.5, (wolf.age / deathAge) * 0.3);
                }
                
                // Apply death probability
                if (Math.random() < deathProbability) {
                    this.killWolf(index, 'age');
                    deathCount++;
                    console.log(`LOUP: Wolf ${index} died naturally at age ${wolf.age.toFixed(1)} (death age threshold: ${deathAge.toFixed(1)})`);
                }
            }
        });
        
        console.log(`LOUP: ${deathCount} wolves died of natural causes`);
    }

    /**
     * Process hunting for all wolves - COMPLETELY REWORKED
     * Now uses a hunting capacity model similar to deer foraging
     * @param {DeerManager} deerManager - DeerManager instance for deer interaction
     */
    processHunting(deerManager) {
        console.log("LOUP: Processing hunting");
        
        // Get all available deer
        const availableDeer = deerManager.deers.filter(deer => deer.isAlive());
        const initialDeerCount = availableDeer.length;
        
        console.log(`LOUP: Starting hunting cycle. Available deer: ${initialDeerCount}`);
        
        // Handle special case: no deer in ecosystem - keep this special handling
        if (initialDeerCount === 0) {
            // Special handling for no deer - make some wolves survive anyway
            const wolves = this.wolves.filter(wolf => wolf.isAlive());
            
            // Let younger wolves with better stamina survive
            // Sort by a combined score of youth and stamina
            const survivingWolves = wolves
                .map((wolf, index) => ({ 
                    wolf, 
                    index: this.wolves.indexOf(wolf),
                    survivalScore: (7 - Math.min(7, wolf.age)) + (wolf.stamina / 2) // Youth + stamina gives survival advantage
                }))
                .sort((a, b) => b.survivalScore - a.survivalScore) // Higher score first
                .slice(0, Math.max(1, Math.floor(wolves.length * 0.2))); // 20% survival rate (reduced from 30%)
                
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
        
        // Pack dynamics - wolves hunt better in packs
        const wolfCount = this.wolves.filter(w => w.isAlive()).length;
        const packBonus = Math.min(1.5, 0.7 + (wolfCount / 10));
        console.log(`LOUP: Pack hunting bonus: ${packBonus.toFixed(2)} (${wolfCount} wolves in pack)`);
        
        for (const wolfIndex of sortedWolfIndices) {
            const wolf = this.wolves[wolfIndex];
            
            // No deer left means the wolf has no chance to find food
            if (remainingDeer.length === 0) {
                console.log(`LOUP: Wolf ${wolfIndex} found no deer remaining`);
                this.killWolf(wolfIndex, 'starvation');
                totalWolvesStarved++;
                continue;
            }
            
            // Calculate hunger-based mass needed
            // More realistic calculation: larger/older wolves need more food
            const hungerFactor = Math.pow(wolf.hunger / 5.0, 1.2); // Non-linear scaling of hunger
            const massNeeded = hungerFactor * (wolf.mass / 25); // Adjusted divisor for more reasonable mass needed
            
            // Calculate hunting capacity (similar to deer foraging capacity)
            const huntingCapacity = this.calculateHuntingCapacity(wolf, remainingDeer.length, packBonus);
            
            // Calculate survival threshold based on hunger
            // Hungrier wolves need more food to survive
            const survivalThreshold = wolf.hunger <= 3 ? 0.4 : 
                                       wolf.hunger <= 7 ? 0.6 : 0.7;
            
            console.log(`LOUP: Wolf ${wolfIndex} hunting - mass needed: ${massNeeded.toFixed(1)}, ` + 
                        `hunting capacity: ${huntingCapacity}, ` +
                        `stamina: ${wolf.stamina.toFixed(1)}, ` +
                        `age: ${wolf.age.toFixed(1)}, ` +
                        `survival threshold: ${(survivalThreshold * 100).toFixed(0)}%`);
            
            // Shuffle the remaining deer for random encounter
            const shuffledDeer = [...remainingDeer].sort(() => Math.random() - 0.5);
            
            // Track mass consumed and deer killed
            let massConsumed = 0;
            let deerIndicesKilled = [];
            
            // Hunt deer until either enough food is found or hunting capacity is exhausted
            const deerToCheck = Math.min(huntingCapacity, shuffledDeer.length);
            
            for (let i = 0; i < deerToCheck && massConsumed < massNeeded; i++) {
                const deer = shuffledDeer[i];
                if (!deer) continue;
                
                // Check if wolf successfully catches this deer
                // Lower success rate for individual catches (more realistic)
                // Young/prime-age wolves with good stamina are better hunters
                const catchSuccess = this.calculateCatchSuccess(wolf, deer, packBonus);

                this.huntingAttempts++;
  
                if (Math.random() < catchSuccess) {
                  this.huntingSuccessTotal++;
                  this.totalPreyKilled++;
                }

                if (Math.random() < catchSuccess) {
                    // Successfully caught deer
                    const deerIndex = deerManager.deers.indexOf(deer);
                    if (deerIndex !== -1) {
                        // How much mass does the wolf still need?
                        const massStillNeeded = massNeeded - massConsumed;
                    
                        // Calculate how much of the deer the wolf consumes
                        // Wolf takes what it needs, not necessarily the entire deer
                        const massFromThisDeer = Math.min(deer.mass, massStillNeeded);
                        
                        // Add mass to what the wolf consumed
                        massConsumed += massFromThisDeer;
                        totalDeerKilled++;
                        
                        // Remove deer from available pool
                        remainingDeer = remainingDeer.filter(d => d !== deer);
                        
                        // Save deer index to kill later
                        deerIndicesKilled.push(deerIndex);
                        
                        console.log(`LOUP: Wolf ${wolfIndex} caught deer at position ${deerIndex}, consuming ${massFromThisDeer.toFixed(1)} mass`);
                        
                        // If wolf has enough food, stop hunting
                        if (massConsumed >= massNeeded) {
                            break;
                        }
                    }
                } else {
                    console.log(`LOUP: Wolf ${wolfIndex} failed to catch deer (success rate: ${(catchSuccess * 100).toFixed(1)}%)`);
                }
            }
            
            // Kill all deer that were hunted
            deerIndicesKilled.forEach(deerIndex => {
                deerManager.killDeer(deerIndex, 'predation');
            });
            
            // Determine if wolf survives based on how much it ate compared to what it needed
            if (massConsumed >= massNeeded * survivalThreshold) {
                console.log(`LOUP: Wolf ${wolfIndex} survived: caught ${deerIndicesKilled.length} deer (${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass consumed, ${(massConsumed/massNeeded*100).toFixed(0)}% of needed)`);
                totalWolvesSurvived++;
            } else {
                console.log(`LOUP: Wolf ${wolfIndex} starved: found only ${massConsumed.toFixed(1)}/${massNeeded.toFixed(1)} mass needed (${(massConsumed/massNeeded*100).toFixed(0)}% of needed)`);
                this.killWolf(wolfIndex, 'starvation');
                totalWolvesStarved++;
            }
        }
        
        console.log(`LOUP: Hunting cycle complete. ${totalWolvesSurvived}/${sortedWolfIndices.length} wolves survived, ${totalWolvesStarved} starved, ${totalDeerKilled} deer killed`);
    }
    
    /**
     * NEW METHOD: Calculate hunting capacity for wolves
     * This represents how many deer a wolf can potentially check/chase while hunting
     * @param {Wolf} wolf - Wolf attempting to hunt
     * @param {number} availableDeerCount - Number of available deer
     * @param {number} packBonus - Bonus from hunting in a pack
     * @returns {number} - Number of deer the wolf can potentially encounter
     */
    calculateHuntingCapacity(wolf, availableDeerCount, packBonus) {
        // Base capacity dependent on stamina (stronger wolves can check more deer)
        // Scale non-linearly so low stamina has a significant disadvantage
        let baseCapacity;
        
        if (wolf.stamina <= 3) {
            // Very low stamina wolves have severely limited hunting capacity
            baseCapacity = Math.max(1, Math.floor(wolf.stamina));
        } else {
            // Normal to high stamina wolves have better capacity
            baseCapacity = Math.floor(2 + (wolf.stamina / 2));
        }
        
        // Age factor - prime-age wolves (3-6 years) have the best hunting capacity
        const ageFactor = Math.max(0.5, 1.0 - Math.abs(wolf.age - 4.5) / 8);
        
        // Apply factors and pack bonus to determine final capacity
        const finalCapacity = Math.max(
            1, // Always check at least one deer
            Math.round(baseCapacity * ageFactor * packBonus)
        );
        
        // Limit by available deer
        return Math.min(finalCapacity, availableDeerCount);
    }
    
    /**
     * NEW METHOD: Calculate success rate for catching a specific deer
     * @param {Wolf} wolf - Wolf attempting to catch deer
     * @param {Object} deer - Deer being hunted
     * @param {number} packBonus - Bonus from hunting in a pack
     * @returns {number} - Probability of successful catch
     */
    calculateCatchSuccess(wolf, deer, packBonus) {
        // Base success rate depends on wolf's stamina
        // Scale non-linearly so low stamina has a much lower success rate
        let baseSuccess;
        
        if (wolf.stamina <= 3) {
            // Very low stamina wolves have very poor success
            baseSuccess = 0.1 * (wolf.stamina / 3);
        } else {
            // Normal to high stamina wolves have better success
            baseSuccess = 0.3 + 0.3 * ((wolf.stamina - 3) / 7);
        }
        
        // Age factor - prime-age wolves (3-6 years) have better success
        const wolfAgeFactor = Math.max(0.5, 1.0 - Math.abs(wolf.age - 4.5) / 9);
        
        // Deer factors - younger and older deer are easier to catch
        const deerAgeFactor = deer.age < 2 || deer.age > 8 ? 1.3 : 1.0;
        
        // Deer stamina affects its ability to escape
        const deerStaminaFactor = Math.max(0.7, 1.2 - (deer.stamina / 15));
        
        // Calculate final success probability
        let finalSuccess = baseSuccess * wolfAgeFactor * deerAgeFactor * deerStaminaFactor * packBonus;
        
        // Cap between 0.1 and 0.8
        return Math.max(0.1, Math.min(0.8, finalSuccess));
    }

    /**
     * Process migration of new wolves into ecosystem
     * @param {number} migrationFactor - Factor affecting migration rate (1-10 scale)
     */
    processMigration(migrationFactor) {
        // Skip if factor is zero
        if (migrationFactor <= 0) return;
        
        // Your existing code here...
        // Scale migration factor where 5 is "normal"
        const packSizeBoost = this.getPopulationCount() < 3 ? 2.0 : 1.0;
        const scaledFactor = Math.pow(migrationFactor / 5.0, 1.5) * packSizeBoost;
        
        // Base migration rate lower than deer (predators are typically less abundant)
        const baseMigrants = Math.random() < 0.3 ? 1 : 0; // 30% chance of 1 wolf, 70% chance of none
        
        // Final number of migrants adjusted by the factor
        const migrantCount = Math.max(0, Math.round(baseMigrants * scaledFactor));
        
        if (migrantCount > 0) {
          console.log(`LOUP: ${migrantCount} wolves migrating into the ecosystem (factor=${migrationFactor})`);
          
          let localSuccessfulMigrants = 0; // Changed variable name to avoid conflicts
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
            localSuccessfulMigrants++;
          }
          
          if (localSuccessfulMigrants > 0) {
            console.log(`LOUP: ${localSuccessfulMigrants} wolves successfully migrated into the ecosystem`);
            // TRACKING: Add this line to track migrations
            this.migrationCount += localSuccessfulMigrants;
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

    getDetailedStatistics() {
        // Get basic statistics
        const baseStats = this.getStatistics();
        
        // Return enhanced statistics
        return {
          ...baseStats,
          // Death causes
          ageDeaths: this.ageDeath,
          starvationDeaths: this.starvationDeath,
          
          // Additional metrics - use defaults if not tracking yet
          migratedCount: this.migrationCount || 0,
          reproducedCount: this.reproductionCount || 0,
          averageHuntingSuccess: this.huntingAttempts > 0 
            ? (this.huntingSuccessTotal / this.huntingAttempts * 100).toFixed(1) + '%'
            : 'N/A',
          preyKilled: this.totalPreyKilled || 0
        };
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

    resetStatistics() {
        this.migrationCount = 0;
        this.reproductionCount = 0;
        this.huntingSuccessTotal = 0;
        this.huntingAttempts = 0;
        this.totalPreyKilled = 0;
    }
}

export { WolfManager };