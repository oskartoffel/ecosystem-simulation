// simulation/Parameters.js

export const SimulationParameters = {
    // General simulation parameters
    gridSize: 10000,
    yearsToSimulate: 1000,
    stabilizationYears: 100,

    // Tree parameters
    tree: {
        initial: {
            number: 5000,
            numberSigma: 100,
            ageAvg: 50,
            ageSigma: 20
        },
        density: 17,          // trees per 81m²
        stressLevel: 20,      // between 1 & 100
        stressIndex: 81,      // 101 - stressLevel
        maturity: 10,
        reproductionFactor: 1.0,  // NEW: Controls tree reproduction rate (1.0 = normal)
        edibleAge: 2          // NEW: Maximum age at which trees are edible by deer
    },

    // Deer parameters
    deer: {
        initial: {
            number: 20,
            populationSize: 100
        },
        staminaFactor: 100000.0,
        hungerFactor: 5.0,
        maturity: 3,
        reproductionFactor: 1.0,  // NEW: Controls deer reproduction rate (1.0 = normal)
        migrationFactor: 1.0      // Exists already in your implementation
    },

    // Wolf parameters
    wolf: {
        initial: {
            number: 5,
            populationSize: 100
        },
        staminaFactor: 1.0,
        hungerFactor: 1.0,
        maturity: 2,
        reproductionFactor: 1.0,  // NEW: Controls wolf reproduction rate (1.0 = normal)
        migrationFactor: 0.5      // Exists already in your implementation
    }
};