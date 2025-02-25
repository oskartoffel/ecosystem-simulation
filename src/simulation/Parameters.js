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
        maturity: 10
    },

    // Deer parameters
    deer: {
        initial: {
            number: 20,
            populationSize: 100
        },
        staminaFactor: 100000.0,
        hungerFactor: 5.0,
        maturity: 3
    },

    // Wolf parameters
    wolf: {
        initial: {
            number: 5,
            populationSize: 100
        },
        staminaFactor: 1.0,
        hungerFactor: 1.0,
        maturity: 2
    }
};