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
                staminaFactor: 5,
                hungerFactor: 2.0
            },
            wolf: {
                initial: 5,
                arraySize: 100,
                maturity: 2,
                staminaFactor: 5,
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
            this.treeManager.processStressDeaths(this.config.tree.stressLevel || 1);
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
            // Track initial populations
            const initialTreeCount = this.treeManager.getPopulationCount();
            const initialDeerCount = this.deerManager.getPopulationCount();
            const initialWolfCount = this.wolfManager.getPopulationCount();
    
            // Tree lifecycle
            this.treeManager.processConcurrence(this.config.tree.density);
            this.treeManager.grow();
            this.treeManager.processAgeDeaths();
            this.treeManager.processStressDeaths(this.config.tree.stressLevel || 1);
            this.treeManager.reproduce(
                this.config.tree.maturity, 
                this.config.tree.reproductionFactor || 5.0
            );
            
            // Deer lifecycle
            // Process deer migration first
            const deerPopulation = this.deerManager.getPopulationCount();
            if (deerPopulation < 10) {  // Apply migration if population is low
                this.deerManager.processMigration(this.config.deer.migrationFactor);
            } else {
                // Still allow some migration with lower probability
                if (Math.random() < 0.2) {
                    this.deerManager.processMigration(this.config.deer.migrationFactor * 0.5);
                }
            }
            
            this.deerManager.reproduce(
                this.config.deer.maturity,
                this.config.deer.reproductionFactor || 5.0
            );
            
            this.deerManager.grow(
                this.config.deer.staminaFactor,
                this.config.deer.hungerFactor
            );
            this.deerManager.processNaturalDeaths();
            this.deerManager.processFeeding(
                this.treeManager.trees, 
                this.config.tree.edibleAge || 4
            );
            
            // Wolf lifecycle
            const wolfPopulation = this.wolfManager.getPopulationCount();
            if (wolfPopulation < 3) {  // Apply migration if population is low
                this.wolfManager.processMigration(this.config.wolf.migrationFactor);
            } else {
                // Still allow some migration with lower probability
                if (Math.random() < 0.1) {
                    this.wolfManager.processMigration(this.config.wolf.migrationFactor * 0.3);
                }
            }
            
            this.wolfManager.reproduce(
                this.config.wolf.maturity,
                this.config.wolf.reproductionFactor || 5.0
            );
            
            this.wolfManager.grow(
                this.config.wolf.staminaFactor,
                this.config.wolf.hungerFactor
            );
            this.wolfManager.processNaturalDeaths();
            this.wolfManager.processHunting(this.deerManager);
            
            // Calculate deaths
            const finalTreeCount = this.treeManager.getPopulationCount();
            const finalDeerCount = this.deerManager.getPopulationCount();
            const finalWolfCount = this.wolfManager.getPopulationCount();
            
            // Add death counts to current stats
            const currentStats = this.getCurrentStats();
            currentStats.trees.deaths = Math.max(0, initialTreeCount - finalTreeCount);
            currentStats.deer.deaths = Math.max(0, initialDeerCount - finalDeerCount);
            currentStats.wolves.deaths = Math.max(0, initialWolfCount - finalWolfCount);
            
            // Record statistics
            this.recordStats();
            
            this.year++;
            this.notifyEventHandlers();
            
            if (this.mode === 'normal') {
                console.groupEnd();
            }
            
            return currentStats;
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
        
        // Track deaths from previous cycle to current
        const prevTreeStats = this.stats.trees.length > 0 ? this.stats.trees[this.stats.trees.length - 1] : null;
        const prevDeerStats = this.stats.deer.length > 0 ? this.stats.deer[this.stats.deer.length - 1] : null;
        const prevWolfStats = this.stats.wolves.length > 0 ? this.stats.wolves[this.stats.wolves.length - 1] : null;
        
        // Calculate deaths by population difference if not directly provided
        if (prevTreeStats && !currentStats.trees.deaths) {
            currentStats.trees.deaths = Math.max(0, prevTreeStats.total - currentStats.trees.total);
        }
        
        if (prevDeerStats && !currentStats.deer.deaths) {
            currentStats.deer.deaths = Math.max(0, prevDeerStats.total - currentStats.deer.total);
        }
        
        if (prevWolfStats && !currentStats.wolves.deaths) {
            currentStats.wolves.deaths = Math.max(0, prevWolfStats.total - currentStats.wolves.total);
        }
        
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