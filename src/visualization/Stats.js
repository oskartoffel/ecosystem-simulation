// Stats.js
class Stats {
    constructor() {
        this.stats = {
            trees: [],
            deer: [],
            wolves: [],
            years: []
        };
    }

    // Record statistics for current year
    recordStats(year, trees, deer, wolves) {
        this.stats.years.push(year);
        this.stats.trees.push(treeAmount(trees));
        this.stats.deer.push(deerAmount(deer));
        this.stats.wolves.push(wolfAmount(wolves));
    }

    // Get statistics for plotting
    getPlotData() {
        return this.stats.years.map((year, index) => ({
            year,
            trees: this.stats.trees[index],
            deer: this.stats.deer[index],
            wolves: this.stats.wolves[index]
        }));
    }

    // Clear all statistics
    reset() {
        this.stats = {
            trees: [],
            deer: [],
            wolves: [],
            years: []
        };
    }

    // Get summary statistics
    getSummary() {
        return {
            currentYear: this.stats.years[this.stats.years.length - 1],
            treePeak: Math.max(...this.stats.trees),
            deerPeak: Math.max(...this.stats.deer),
            wolvesPeak: Math.max(...this.stats.wolves),
            treeAverage: Math.round(this.stats.trees.reduce((a, b) => a + b, 0) / this.stats.trees.length),
            deerAverage: Math.round(this.stats.deer.reduce((a, b) => a + b, 0) / this.stats.deer.length),
            wolvesAverage: Math.round(this.stats.wolves.reduce((a, b) => a + b, 0) / this.stats.wolves.length)
        };
    }
}

export default Stats;