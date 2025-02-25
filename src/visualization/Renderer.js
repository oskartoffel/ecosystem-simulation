// Renderer.js
class Renderer {
    constructor(p5Instance) {
        this.p5 = p5Instance;
        this.width = 800;
        this.height = 600;
        this.padding = 50;
        this.graphHeight = 400;
    }

    setup() {
        this.p5.createCanvas(this.width, this.height);
        this.p5.background(255);
    }

    drawPopulationGraph(stats) {
        const plotData = stats.getPlotData();
        if (plotData.length === 0) return;

        this.p5.background(255);
        
        // Draw axes
        this.p5.stroke(0);
        this.p5.line(this.padding, this.height - this.padding, 
                     this.width - this.padding, this.height - this.padding); // x-axis
        this.p5.line(this.padding, this.height - this.padding, 
                     this.padding, this.padding); // y-axis

        // Find max values for scaling
        const maxTrees = Math.max(...plotData.map(d => d.trees));
        const maxDeer = Math.max(...plotData.map(d => d.deer));
        const maxWolves = Math.max(...plotData.map(d => d.wolves));
        const maxPop = Math.max(maxTrees, maxDeer, maxWolves);

        // Draw population lines
        this.drawPopulationLine(plotData.map(d => d.trees), maxPop, [46, 125, 50]); // Green for trees
        this.drawPopulationLine(plotData.map(d => d.deer), maxPop, [216, 67, 21]); // Orange for deer
        this.drawPopulationLine(plotData.map(d => d.wolves), maxPop, [69, 90, 100]); // Blue-grey for wolves

        // Draw legend
        this.drawLegend();
    }

    drawPopulationLine(data, maxValue, color) {
        this.p5.stroke(color[0], color[1], color[2]);
        this.p5.noFill();
        this.p5.beginShape();
        
        for (let i = 0; i < data.length; i++) {
            const x = this.p5.map(i, 0, data.length - 1, 
                                this.padding, this.width - this.padding);
            const y = this.p5.map(data[i], 0, maxValue, 
                                this.height - this.padding, this.padding);
            this.p5.vertex(x, y);
        }
        
        this.p5.endShape();
    }

    drawLegend() {
        const legendX = this.width - 120;
        const legendY = 30;
        
        // Trees
        this.p5.stroke(46, 125, 50);
        this.p5.line(legendX, legendY, legendX + 20, legendY);
        this.p5.noStroke();
        this.p5.fill(0);
        this.p5.text("Trees", legendX + 30, legendY + 5);
        
        // Deer
        this.p5.stroke(216, 67, 21);
        this.p5.line(legendX, legendY + 20, legendX + 20, legendY + 20);
        this.p5.noStroke();
        this.p5.text("Deer", legendX + 30, legendY + 25);
        
        // Wolves
        this.p5.stroke(69, 90, 100);
        this.p5.line(legendX, legendY + 40, legendX + 20, legendY + 40);
        this.p5.noStroke();
        this.p5.text("Wolves", legendX + 30, legendY + 45);
    }
}

export default Renderer;