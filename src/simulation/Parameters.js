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
        density: 17,          // trees per 81m² (1-20 scale)
        stressLevel: 5,       // Stress level (1-10 scale), higher = more stress deaths
        maturity: 10,         // Age at which trees can reproduce
        reproductionFactor: 5, // Reproduction rate (1-10 scale), 5 = normal
        edibleAge: 4          // Maximum age at which trees are edible by deer
    },

    // Deer parameters
    deer: {
        initial: {
            number: 20,
            populationSize: 100
        },
        staminaFactor: 5.0,   // Stamina factor (1-10 scale), 5 = normal
        hungerFactor: 5.0,    // Hunger factor (1-10 scale), 5 = normal
        maturity: 3,          // Age at which deer can reproduce
        reproductionFactor: 5.0, // Reproduction rate (1-10 scale), 5 = normal
        migrationFactor: 5.0    // Migration rate (1-10 scale), 5 = normal
    },

    // Wolf parameters
    wolf: {
        initial: {
            number: 5,
            populationSize: 100
        },
        staminaFactor: 5.0,   // Stamina factor (1-10 scale), 5 = normal
        hungerFactor: 5.0,    // Hunger factor (1-10 scale), 5 = normal
        maturity: 2,          // Age at which wolves can reproduce
        reproductionFactor: 5.0, // Reproduction rate (1-10 scale), 5 = normal
        migrationFactor: 5.0    // Migration rate (1-10 scale), 5 = normal
    }
};