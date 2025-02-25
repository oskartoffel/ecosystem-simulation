// utils/ParameterManager.js
export class ParameterManager {
    constructor() {
      this.storageKey = 'ecosystem-simulation-parameters';
    }
  
    // Save parameters to local storage
    saveParameters(params) {
      localStorage.setItem(this.storageKey, JSON.stringify(params));
    }
  
    // Load parameters from local storage
    loadParameters() {
      const storedParams = localStorage.getItem(this.storageKey);
      return storedParams ? JSON.parse(storedParams) : null;
    }
  
    // Generate a JavaScript file with parameters
    generateParametersJS(params) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Create nicely formatted JS code
      const jsContent = `// Ecosystem Simulation Parameters - ${timestamp}
  // Save this file for future reference
  
  export const SimulationParameters = ${JSON.stringify(params, null, 2)};
  
  // Example usage:
  // import { SimulationParameters } from './path/to/this/file';
  // const simulation = new SimulationManager(SimulationParameters);
  `;
      
      return jsContent;
    }
  
    // Create and trigger download of parameters JS file
    downloadParametersJS(params) {
      const jsContent = this.generateParametersJS(params);
      const blob = new Blob([jsContent], { type: 'application/javascript' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `ecosystem-parameters-${timestamp}.js`;
      downloadLink.click();
      
      URL.revokeObjectURL(downloadLink.href);
    }
  }
  
  export default new ParameterManager();