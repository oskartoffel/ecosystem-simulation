// SimulationManager.js
import { TreeManager } from '../models/TreeManager';
import { DeerManager } from '../models/DeerManager';
import { WolfManager } from '../models/WolfManager';
import { Utils } from '../utils/helpers';

class SimulationManager {
    constructor(config, mode = 'normal') {
        this.config = this.validateConfig(config);
        this.mode = mode;  // 'normal' or 'visualization'
        this.year = 0;
        this.paused = true;
        this.stats = {
            trees: [],
            deer: [],
            wolves: [],
            treeAges: [],
            deerAges: [],
            wolfAges: []
        };

        // Initialize managers
        this.treeManager = new TreeManager(config.gridSize);
        this.deerManager = new DeerManager();
        this.wolfManager = new WolfManager();

        // Initialize event handlers for interactive features
        this.eventHandlers = new Set();
    }

    validateConfig(config) {
        const defaultConfig = {
            gridSize: 10000,
            years: 100,
            stabilizationYears: 10,
            tree: {
                initial: 5000,
                arraySize: 10000,
                density: 15,
                ageAvg: 30,
                ageSigma: 20,
                maturity: 10,
                stressIndex: 90
            },
            deer: {
                initial: 20,
                arraySize: 200,
                maturity: 2,
                staminaFactor: 100000.0,
                hungerFactor: 2.0
            },
            wolf: {
                initial: 5,
                arraySize: 100,
                maturity: 2,
                staminaFactor: 30,
                hungerFactor: 1.0
            }
        };

        // Deep merge configs
        const mergedConfig = {
            ...defaultConfig,
            tree: { ...defaultConfig.tree, ...(config.tree || {}) },
            deer: { ...defaultConfig.deer, ...(config.deer || {}) },
            wolf: { ...defaultConfig.wolf, ...(config.wolf || {}) }
        };

        // Validate critical values
        mergedConfig.gridSize = Math.max(1000, mergedConfig.gridSize);
        mergedConfig.years = Math.max(1, mergedConfig.years);
        mergedConfig.stabilizationYears = Math.max(0, mergedConfig.stabilizationYears);

        // Ensure array sizes are adequate but not too large
        mergedConfig.tree.arraySize = Math.max(mergedConfig.tree.arraySize, mergedConfig.tree.initial);
        mergedConfig.deer.arraySize = Math.min(1000, Math.max(100, mergedConfig.deer.initial * 5));
        mergedConfig.wolf.arraySize = Math.min(500, Math.max(50, mergedConfig.wolf.initial * 5));

        if (this.mode === 'normal') {
            console.log("Validated configuration:", mergedConfig);
        }

        return mergedConfig;
    }

    initialize() {
        if (this.mode === 'normal') {
            console.log("Starting initialization...");
        }
        
        // Initialize forest and let it stabilize
        this.treeManager.initialPlanting(
            this.config.tree.initial,
            this.config.tree.ageAvg,
            this.config.tree.ageSigma
        );
    
        if (this.mode === 'normal') {
            console.log(`Initial tree count: ${this.treeManager.getPopulationCount()}`);
        }
        
        // Stabilize forest
        if (this.mode === 'normal') {
            console.log("Starting forest stabilization...");
        }
        
        for (let i = 0; i < this.config.stabilizationYears; i++) {
            this.treeManager.grow();
            this.treeManager.processConcurrence(this.config.tree.density);
            this.treeManager.processStressDeaths(this.config.tree.stressIndex);
            this.treeManager.reproduce(this.config.tree.maturity);
            this.treeManager.processAgeDeaths();
            
            if (this.mode === 'normal' && i % 10 === 0) {
                console.log(`Stabilization year ${i}: Tree count = ${this.treeManager.getPopulationCount()}`);
            }
        }
        
        // Initialize animals
        if (this.mode === 'normal') {
            console.log("Initializing deer population...");
        }
        
        this.deerManager.initialize(
            this.config.deer.initial,
            this.config.deer.arraySize,
            this.config.deer.staminaFactor,
            this.config.deer.hungerFactor
        );
    
        if (this.mode === 'normal') {
            console.log("Initializing wolf population...");
        }
        
        this.wolfManager.initialize(
            this.config.wolf.initial,
            this.config.wolf.arraySize,
            this.config.wolf.staminaFactor,
            this.config.wolf.hungerFactor
        );
    
        this.year = 0;
        this.clearStats();
        this.paused = false;

        const initialStats = this.getCurrentStats();
        if (this.mode === 'normal') {
            console.log("Initialization complete. Initial population stats:", initialStats);
        }
    }

    simulateYear() {
        if (this.mode === 'normal') {
            console.group(`Year ${this.year}`);
        }
        
        try {
            // Tree lifecycle
            this.treeManager.processConcurrence(this.config.tree.density);
            this.treeManager.grow();
            this.treeManager.processAgeDeaths();
            this.treeManager.processStressDeaths(this.config.tree.stressIndex);
            // Pass reproduction factor to control tree reproduction
            this.treeManager.reproduce(
                this.config.tree.maturity, 
                this.config.tree.reproductionFactor || 1.0
            );
            
            // Deer lifecycle
            // Process deer migration first - add new individuals if population is low
            const deerPopulation = this.deerManager.getPopulationCount();
            if (deerPopulation < 10) {  // Apply migration if population is low
                this.deerManager.processMigration(this.config.deer.migrationFactor);
            } else {
                // Still allow some migration, but with lower probability for healthy populations
                if (Math.random() < 0.2) {  // 20% chance of migration even for healthy populations
                    this.deerManager.processMigration(this.config.deer.migrationFactor * 0.5);  // Reduce factor
                }
            }
            
            // Pass reproduction factor to control deer reproduction
            this.deerManager.reproduce(
                this.config.deer.maturity,
                this.config.deer.reproductionFactor || 1.0
            );
            
            this.deerManager.grow(
                this.config.deer.staminaFactor,
                this.config.deer.hungerFactor
            );
            this.deerManager.processNaturalDeaths();
            // Pass edible age parameter to control what trees deer can eat
            this.deerManager.processFeeding(
                this.treeManager.trees, 
                this.config.tree.edibleAge || 2
            );
            
            // Wolf lifecycle
            // Process wolf migration first - add new individuals if population is low
            const wolfPopulation = this.wolfManager.getPopulationCount();
            if (wolfPopulation < 3) {  // Apply migration if population is low
                this.wolfManager.processMigration(this.config.wolf.migrationFactor);
            } else {
                // Still allow some migration, but with lower probability for healthy populations
                if (Math.random() < 0.1) {  // 10% chance of migration even for healthy populations
                    this.wolfManager.processMigration(this.config.wolf.migrationFactor * 0.3);  // Reduce factor more
                }
            }
            
            // Pass reproduction factor to control wolf reproduction
            this.wolfManager.reproduce(
                this.config.wolf.maturity,
                this.config.wolf.reproductionFactor || 1.0
            );
            
            this.wolfManager.grow(
                this.config.wolf.staminaFactor,
                this.config.wolf.hungerFactor
            );
            this.wolfManager.processNaturalDeaths();
            this.wolfManager.processHunting(this.deerManager);
            
            // Record statistics
            this.recordStats();
            
            this.year++;
            this.notifyEventHandlers();
            
            if (this.mode === 'normal') {
                console.groupEnd();
            }
            
            return this.getCurrentStats();
        } catch (error) {
            if (this.mode === 'normal') {
                console.error('Simulation Error:', error);
                console.groupEnd();
            }
            throw error;
        }
    }

    getCurrentStats() {
        return {
            year: this.year,
            trees: this.treeManager.getStatistics(),
            deer: this.deerManager.getStatistics(),
            wolves: this.wolfManager.getStatistics()
        };
    }

    recordStats() {
        const currentStats = this.getCurrentStats();
        this.stats.trees.push(currentStats.trees);
        this.stats.deer.push(currentStats.deer);
        this.stats.wolves.push(currentStats.wolves);
    }

    clearStats() {
        Object.keys(this.stats).forEach(key => {
            this.stats[key] = [];
        });
    }

    // Interactive features
    addEventHandler(handler) {
        this.eventHandlers.add(handler);
    }

    removeEventHandler(handler) {
        this.eventHandlers.delete(handler);
    }

    notifyEventHandlers() {
        const currentStats = this.getCurrentStats();
        this.eventHandlers.forEach(handler => handler(currentStats));
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    reset() {
        this.pause();
        this.initialize();
    }

    getState() {
        return {
            year: this.year,
            stats: this.stats,
            currentStats: this.getCurrentStats(),
            config: this.config,
            isPaused: this.paused
        };
    }
}

export { SimulationManager };