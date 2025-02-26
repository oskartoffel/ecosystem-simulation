// models/TreeManager.js
import { Tree } from './classes';
import { Utils } from '../utils/helpers';

class TreeManager {
    constructor(gridSize) {
        this.trees = Array(gridSize).fill(null).map(() => new Tree(0, 0, 0, 0, 0));
        this.grid = Utils.createGrid(gridSize);
        this.gridSize = gridSize;
        this.isStabilizing = true;  // Add flag for stabilization phase
    }

    calculateTreeProperties(tree) {
        if (!tree || !(tree instanceof Tree)) return null;
        
        // Create a new Tree instance instead of using object spread
        const newTree = new Tree(
            tree.position,
            tree.age,
            0,  // height will be calculated
            0,  // diameter will be calculated
            0   // mass will be calculated
        );
        
        newTree.diameter = 0.01 * tree.age;
        newTree.height = 1.3 + Math.pow((newTree.diameter / (1.95 + 0.13 * newTree.diameter)), 2.0);
        newTree.mass = 0.0613 * Math.pow(100 * newTree.diameter, 2.7133);
        
        return newTree;
    }

    findEmptyPosition() {
        const emptyPositions = this.trees
            .map((tree, index) => !tree || tree.position === 0 ? index : -1)
            .filter(index => index !== -1);
        
        if (emptyPositions.length === 0) return -1;
        return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    }

    initialPlanting(limit, ageAvg, ageSigma) {
        console.log(`Initial planting of ${limit} trees...`);
        
        for (let i = 0; i < limit; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) {
                console.log("No more space available for planting");
                break;
            }

            const age = Math.max(1, Math.floor(Utils.randGauss(ageAvg, ageSigma)));
            const tempTree = new Tree(newPos + 1, age, 0, 0, 0);
            const calculatedTree = this.calculateTreeProperties(tempTree);
            
            if (calculatedTree) {
                this.trees[newPos] = calculatedTree;
            }
        }
        
        console.log(`Planted ${this.getPopulationCount()} trees`);
    }

    processConcurrence(density) {
        const { sideLength } = this.grid;
        const maxInt = density;
        const gridRange = 4;

        for (let y = gridRange; y < sideLength - gridRange; y++) {
            for (let x = gridRange; x < sideLength - gridRange; x++) {
                const centerIndex = this.grid.getIndex(x, y);
                const localTrees = [];

                // Gather trees in local area
                for (let dy = -gridRange; dy <= gridRange; dy++) {
                    for (let dx = -gridRange; dx <= gridRange; dx++) {
                        const index = this.grid.getIndex(x + dx, y + dy);
                        if (index >= 0 && index < this.trees.length && 
                            this.trees[index] && this.trees[index].position !== 0) {
                            localTrees.push(this.trees[index]);
                        }
                    }
                }

                if (localTrees.length > maxInt) {
                    localTrees.sort((a, b) => b.diameter - a.diameter);
                    for (let i = maxInt; i < localTrees.length; i++) {
                        if (localTrees[i] && localTrees[i].position) {
                            this.removeTree(localTrees[i].position - 1);
                        }
                    }
                }
            }
        }
    }

    grow() {
        this.trees = this.trees.map(tree => {
            if (!tree || tree.position === 0) return tree;
            
            const grownTree = { ...tree };
            grownTree.diameter += 0.01;
            grownTree.height = 1.3 + Math.pow((grownTree.diameter / (1.95 + 0.13 * grownTree.diameter)), 2.0);
            grownTree.age += 1;
            return grownTree;
        });
    }

    processStressDeaths(stressProb) {
        this.trees.forEach((tree, index) => {
            if (tree && tree.position !== 0 && Math.random() < 1/stressProb) {
                this.removeTree(index);
            }
        });
    }

    removeTree(index) {
        if (index >= 0 && index < this.trees.length) {
            this.trees[index] = new Tree(0, 0, 0, 0, 0);
        }
    }

    reproduce(maturityAge, reproductionFactor = 1.0) {
        const matureTrees = this.trees.filter(tree => tree && tree.age >= maturityAge).length;
        // Apply the reproduction factor to control new tree generation
        const adjustedTreeCount = Math.floor(matureTrees * reproductionFactor);
        
        // Only log during main simulation
        if (!this.isStabilizing) {
            console.log(`TreeManager: Found ${matureTrees} mature trees (age >= ${maturityAge}), adjusted to ${adjustedTreeCount} with factor ${reproductionFactor}`);
        }
        this.plantYoungTrees(adjustedTreeCount);
    }

    plantYoungTrees(amount) {
        let planted = 0;
        for (let i = 0; i < amount; i++) {
            const newPos = this.findEmptyPosition();
            if (newPos === -1) break;

            const tempTree = new Tree(newPos + 1, 1, 0, 0, 0);
            const calculatedTree = this.calculateTreeProperties(tempTree);
            
            if (calculatedTree) {
                this.trees[newPos] = calculatedTree;
                planted++;
            }
        }
        
        // Only log during main simulation
        if (!this.isStabilizing) {
            const youngTrees = this.trees.filter(tree => tree && tree.position !== 0 && tree.age <= 2).length;
            console.log(`TreeManager: Planted ${planted}/${amount} young trees. Young trees (age <= 2): ${youngTrees}`);
        }
    }

    setStabilizationMode(isStabilizing) {
        this.isStabilizing = isStabilizing;
    }
    
    processAgeDeaths() {
        this.trees.forEach((tree, index) => {
            if (tree && tree.position !== 0) {
                const deathAge = Utils.randGauss(100, 10);
                if (tree.age > deathAge) {
                    this.removeTree(index);
                }
            }
        });
    }

    getPopulationCount() {
        return this.trees.filter(tree => tree && tree.position !== 0).length;
    }

    getStatistics() {
        const aliveTrees = this.trees.filter(tree => tree && tree.position !== 0);
        const deaths = this.trees.filter(tree => !tree || tree.position === 0).length;
        const youngTrees = aliveTrees.filter(tree => tree.age <= 2).length;
        
        const stats = {
            total: aliveTrees.length,
            averageAge: aliveTrees.reduce((sum, tree) => sum + tree.age, 0) / aliveTrees.length || 0,
            deaths: deaths,
            youngTrees: youngTrees,
            averageHeight: aliveTrees.reduce((sum, tree) => sum + tree.height, 0) / aliveTrees.length || 0
        };
        
        console.log(`Tree Statistics: Population=${stats.total}, Young Trees=${youngTrees}, Avg Age=${stats.averageAge.toFixed(1)}, Deaths=${deaths}`);
        
        return stats;
    }

    getAgeDistribution(aliveTrees) {
        const distribution = {};
        aliveTrees.forEach(tree => {
            if (tree) {
                distribution[tree.age] = (distribution[tree.age] || 0) + 1;
            }
        });
        return distribution;
    }
}

export { TreeManager };