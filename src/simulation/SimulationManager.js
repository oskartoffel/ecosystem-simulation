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
                stressLevel: 5,
                reproductionFactor: 5,
                edibleAge: 4
            },
            deer: {
                initial: 20,
                arraySize: 200,
                maturity: 2,
                staminaFactor: 5.0,
                hungerFactor: 5.0,
                reproductionFactor: 5.0,
                migrationFactor: 5.0
            },
            wolf: {
                initial: 5,
                arraySize: 100,
                maturity: 2,
                staminaFactor: 5.0,
                hungerFactor: 5.0,
                reproductionFactor: 5.0,
                migrationFactor: 5.0
            }
        };

        // Deep merge configs ensuring tree.edibleAge exists
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
        
        // Set tree manager in stabilization mode for initial planting
        this.treeManager.setStabilizationMode(true);
        
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
            this.treeManager.processAgeDeaths();
            this.treeManager.processConcurrence(this.config.tree.density);
            this.treeManager.processStressDeaths(this.config.tree.stressLevel || 5);
            this.treeManager.reproduce(this.config.tree.maturity, this.config.tree.reproductionFactor || 5);
            
            if (this.mode === 'normal' && i % 10 === 0) {
                console.log(`Stabilization year ${i}: Tree count = ${this.treeManager.getPopulationCount()}`);
            }
        }
        
        // IMPORTANT: Set tree manager to simulation mode to enable detailed logging
        this.treeManager.setStabilizationMode(false);
        console.log("Exiting stabilization mode, entering simulation mode");
        
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
          // Reset statistics at the beginning of each year
          // Check if the methods exist first to avoid errors
          if (typeof this.deerManager.resetStatistics === 'function') {
            this.deerManager.resetStatistics();
          }
          
          if (typeof this.wolfManager.resetStatistics === 'function') {
            this.wolfManager.resetStatistics();
          }
            // Track initial populations
            const initialTreeCount = this.treeManager.getPopulationCount();
            const initialDeerCount = this.deerManager.getPopulationCount();
            const initialWolfCount = this.wolfManager.getPopulationCount();
    
            // === TREE LIFECYCLE ===
            // Step 1: Grow all trees by one year
            this.treeManager.grow();
            
            // Step 2: Process tree deaths in the correct order
            this.treeManager.processAgeDeaths();
            this.treeManager.processStressDeaths(this.config.tree.stressLevel || 5);
            this.treeManager.processConcurrence(this.config.tree.density);
            
            // Step 3: Allow mature trees to reproduce
            this.treeManager.reproduce(
                this.config.tree.maturity, 
                this.config.tree.reproductionFactor || 5.0
            );
            
            // === DEER LIFECYCLE ===
            // Step 1: Process deer migration first (chance for new deer to enter)
            const deerPopulation = this.deerManager.getPopulationCount();
            // Apply migration with higher probability when population is low
            if (deerPopulation < 10) {
                this.deerManager.processMigration(this.config.deer.migrationFactor);
            } else {
                // Still allow some migration with lower probability 
                if (Math.random() < 0.2) {
                    // Reduce migration by half when population is adequate
                    this.deerManager.processMigration(this.config.deer.migrationFactor * 0.5);
                }
            }
            
            // Step 2: Allow mature deer to reproduce
            this.deerManager.reproduce(
                this.config.deer.maturity,
                this.config.deer.reproductionFactor || 5.0
            );
            
            // Step 3: Grow deer (age, update mass, hunger, stamina)
            this.deerManager.grow(
                this.config.deer.staminaFactor,
                this.config.deer.hungerFactor
            );
            
            // Step 4: Process natural deaths (age)
            this.deerManager.processNaturalDeaths();
            
            // Step 5: Process feeding (most critical part of deer lifecycle)
            this.deerManager.processFeeding(
                this.treeManager.trees, 
                this.config.tree.edibleAge, 
                this.treeManager
            );
            
            // === WOLF LIFECYCLE ===
            // Step 1: Process wolf migration (chance for new wolves to enter)
            const wolfPopulation = this.wolfManager.getPopulationCount();
            // Apply migration with higher probability when population is low
            if (wolfPopulation < 3) {
                this.wolfManager.processMigration(this.config.wolf.migrationFactor);
            } else {
                // Still allow some migration with lower probability 
                if (Math.random() < 0.1) { // 10% chance for migration when population is healthy
                    // Reduce migration rate for healthy populations
                    this.wolfManager.processMigration(this.config.wolf.migrationFactor * 0.3);
                }
            }

            // Step 2: Allow mature wolves to reproduce
            this.wolfManager.reproduce(
                this.config.wolf.maturity,
                this.config.wolf.reproductionFactor || 5.0
            );

            // Step 3: Grow wolves (age, update mass, hunger, stamina)
            this.wolfManager.grow(
                this.config.wolf.staminaFactor,
                this.config.wolf.hungerFactor
            );

            // Step 4: Process natural deaths (age)
            this.wolfManager.processNaturalDeaths();

            // Step 5: Process hunting (prey on deer population)
            this.wolfManager.processHunting(this.deerManager);
            
            // Calculate deaths
            const finalTreeCount = this.treeManager.getPopulationCount();
            const finalDeerCount = this.deerManager.getPopulationCount();
            const finalWolfCount = this.wolfManager.getPopulationCount();
            
            
            // We no longer need this manual calculation for trees since TreeManager now tracks all death causes
            // including consumption by deer, and returns a totalDeaths property
            // currentStats.trees.deaths = Math.max(0, initialTreeCount - finalTreeCount);
            
            const currentStats = {
                year: this.year,
                trees: typeof this.treeManager.getDetailedStatistics === 'function' 
                    ? this.treeManager.getDetailedStatistics() 
                    : this.treeManager.getStatistics(),
                deer: typeof this.deerManager.getDetailedStatistics === 'function'
                    ? this.deerManager.getDetailedStatistics()
                    : this.deerManager.getStatistics(),
                wolves: typeof this.wolfManager.getDetailedStatistics === 'function'
                    ? this.wolfManager.getDetailedStatistics()
                    : this.wolfManager.getStatistics()
              };
              
              // Record statistics
              this.recordStats();
              
              // Advance year and notify handlers
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
        console.log(`SIM-DEBUG: Tree stats - total: ${currentStats.trees.total}, consumedByDeer: ${currentStats.trees.consumedByDeer}`);
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
        
        // Record summary statistics
        if (this.mode === 'normal' && this.year % 5 === 0) {
            console.log(`Year ${this.year} Complete:
                Trees: ${currentStats.trees.total} (Avg Age: ${currentStats.trees.averageAge.toFixed(1)}, Deaths: ${currentStats.trees.deaths || 0})
                Deer: ${currentStats.deer.total} (Avg Age: ${currentStats.deer.averageAge.toFixed(1)}, Deaths: ${currentStats.deer.deaths || 0})
                Wolves: ${currentStats.wolves.total} (Avg Age: ${currentStats.wolves.averageAge.toFixed(1)}, Deaths: ${currentStats.wolves.deaths || 0})`
            );
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