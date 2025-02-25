// utils/helpers.js
import { Tree } from '../models/classes';

class Utils {
    // Gaussian random number generator
    static randGauss(mu, sigma) {
        let U1, U2, W, mult;
        let X1, X2;
        
        do {
            U1 = -1 + (Math.random() * 2);
            U2 = -1 + (Math.random() * 2);
            W = Math.pow(U1, 2) + Math.pow(U2, 2);
        } while (W >= 1 || W === 0);

        mult = Math.sqrt((-2 * Math.log(W)) / W);
        X1 = U1 * mult;
        X2 = U2 * mult;

        return mu + sigma * X1;
    }

    // Find minimum index based on diameter
    static findMinIndex(trees) {
        if (!Array.isArray(trees) || trees.length === 0) {
            throw new Error('Input must be a non-empty array of trees');
        }

        let min = Infinity;
        let minIndex = -1;

        trees.forEach((tree, index) => {
            if (tree instanceof Tree && tree.diameter < min) {
                min = tree.diameter;
                minIndex = index;
            }
        });

        if (minIndex === -1) {
            throw new Error('No valid trees found in array');
        }

        return minIndex;
    }

    // Create a grid for the ecosystem
    static createGrid(size) {
        return {
            size: size,
            sideLength: Math.floor(Math.sqrt(size)),
            getCoordinates: function(index) {
                return {
                    x: index % this.sideLength,
                    y: Math.floor(index / this.sideLength)
                };
            },
            getIndex: function(x, y) {
                return y * this.sideLength + x;
            }
        };
    }

    // Additional utility functions can be added here
}

export { Utils };
