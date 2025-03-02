import React, { useState, useEffect } from 'react';

// Default configuration to use when values are invalid
const defaultConfig = {
  gridSize: 10000,
  years: 20,
  stabilizationYears: 10,
  tree: {
    initial: 1000,
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
    maturity: 2,
    staminaFactor: 5.0,
    hungerFactor: 5.0,
    reproductionFactor: 5.0,
    migrationFactor: 5.0
  },
  wolf: {
    initial: 5,
    maturity: 2,
    staminaFactor: 5.0,
    hungerFactor: 5.0,
    reproductionFactor: 5.0,
    migrationFactor: 5.0
  }
};

const ParameterControls = ({ defaultConfig: initialConfig, onStart }) => {
  const [config, setConfig] = useState({...defaultConfig, ...initialConfig});
  const [isConfiguring, setIsConfiguring] = useState(true);

  // Ensure arrays sizes are sufficient
  useEffect(() => {
    // Update when defaultConfig changes (e.g. when saved parameters are loaded)
    if (initialConfig) {
      setConfig(prevConfig => {
        const newConfig = {...prevConfig, ...initialConfig};
        
        // Make sure array sizes are adequate for all populations
        if (!newConfig.tree.arraySize || newConfig.tree.arraySize < newConfig.tree.initial) {
          newConfig.tree.arraySize = Math.max(10000, newConfig.tree.initial * 1.5);
        }
        
        if (!newConfig.deer.arraySize || newConfig.deer.arraySize < newConfig.deer.initial * 3) {
          newConfig.deer.arraySize = Math.max(100, newConfig.deer.initial * 5);
        }
        
        if (!newConfig.wolf.arraySize || newConfig.wolf.arraySize < newConfig.wolf.initial * 3) {
          newConfig.wolf.arraySize = Math.max(50, newConfig.wolf.initial * 5); 
        }
        
        return newConfig;
      });
    }
  }, [initialConfig]);

  // Handle numeric input changes with validation
  const handleNumericChange = (category, parameter, value) => {
    // Parse the numeric value, using default if invalid
    let numericValue = Number(value);
    
    // If it's not a valid number or negative, use a default value
    if (isNaN(numericValue) || numericValue < 0) {
      numericValue = getDefaultValue(category, parameter);
    }
    
    // Apply the change
    if (category === 'general') {
      setConfig(prev => ({
        ...prev,
        [parameter]: numericValue
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [parameter]: numericValue
        }
      }));
    }
  };
  
  // Get a default value for a parameter if invalid
  const getDefaultValue = (category, parameter) => {
    if (category === 'general') {
      return defaultConfig[parameter] || 0;
    } else {
      return defaultConfig[category]?.[parameter] || 0;
    }
  };

  const handleSubmit = () => {
    // Create the final configuration with proper array sizes
    const finalConfig = {
      ...config,
      tree: {
        ...config.tree,
        arraySize: Math.max(10000, config.tree.initial * 1.5)
      },
      deer: {
        ...config.deer,
        arraySize: Math.max(100, config.deer.initial * 5)
      },
      wolf: {
        ...config.wolf,
        arraySize: Math.max(50, config.wolf.initial * 5)
      }
    };
    
    setIsConfiguring(false);
    onStart(finalConfig);
  };

  const handleReset = () => {
    // Reset to default values
    setConfig({...defaultConfig});
  };

  // Simple numeric input component with validation
  const NumericInput = ({ label, value, onChange, min = 0, max = null, step = 1 }) => (
    <div className="mb-2">
      <label className="block text-sm font-medium">
        {label}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );

  // Simplified section for parameter group
  const ParameterSection = ({ title, category, parameters, color }) => (
    <div className="bg-white p-4 rounded-lg shadow border-l-4" style={{ borderLeftColor: color }}>
      <h3 className="font-semibold text-lg mb-3" style={{ color }}>{title}</h3>
      <div className="space-y-3">
        {parameters.map(param => (
          <NumericInput
            key={param.name}
            label={param.label}
            value={category === 'general' ? config[param.name] : config[category][param.name]}
            onChange={(value) => handleNumericChange(category, param.name, value)}
            min={param.min}
            max={param.max}
            step={param.step}
          />
        ))}
      </div>
    </div>
  );

  if (!isConfiguring) return null;

  return (
    <div className="bg-gray-50 rounded-lg shadow-lg p-6 w-full max-w-4xl mb-8">
      <h2 className="text-2xl font-bold mb-6">Ecosystem Simulation Parameters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* General Parameters */}
        <ParameterSection
          title="General Settings"
          category="general"
          color="#3b82f6" // blue
          parameters={[
            { name: "gridSize", label: "Grid Size", min: 1000, max: 100000, step: 1000 },
            { name: "years", label: "Years to Simulate", min: 1, max: 1000 },
            { name: "stabilizationYears", label: "Stabilization Years", min: 0, max: 100 }
          ]}
        />
        
        {/* Tree Parameters */}
        <ParameterSection
          title="Tree Parameters"
          category="tree"
          color="#059669" // green
          parameters={[
            { name: "initial", label: "Initial Population", min: 100, max: 10000, step: 100 },
            { name: "density", label: "Density (1-20)", min: 1, max: 20, step: 1 },
            { name: "ageAvg", label: "Average Initial Age", min: 1, max: 100 },
            { name: "maturity", label: "Maturity Age", min: 1, max: 50 },
            { name: "stressLevel", label: "Stress Level (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "reproductionFactor", label: "Reproduction Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "edibleAge", label: "Max Edible Age (for deer)", min: 1, max: 10 }
          ]}
        />
        
        {/* Deer Parameters */}
        <ParameterSection
          title="Deer Parameters"
          category="deer"
          color="#d97706" // amber
          parameters={[
            { name: "initial", label: "Initial Population", min: 0, max: 500 },
            { name: "maturity", label: "Maturity Age", min: 1, max: 10 },
            { name: "staminaFactor", label: "Stamina Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "hungerFactor", label: "Hunger Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "reproductionFactor", label: "Reproduction Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "migrationFactor", label: "Migration Factor (1-10)", min: 0, max: 10, step: 0.5 }
          ]}
        />
        
        {/* Wolf Parameters */}
        <ParameterSection
          title="Wolf Parameters"
          category="wolf"
          color="#6b7280" // gray
          parameters={[
            { name: "initial", label: "Initial Population", min: 0, max: 100 },
            { name: "maturity", label: "Maturity Age", min: 1, max: 10 },
            { name: "staminaFactor", label: "Stamina Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "hungerFactor", label: "Hunger Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "reproductionFactor", label: "Reproduction Factor (1-10)", min: 1, max: 10, step: 0.5 },
            { name: "migrationFactor", label: "Migration Factor (1-10)", min: 0, max: 10, step: 0.5 }
          ]}
        />
      </div>

      {/* Display current configuration for debugging */}
      <details className="mb-6 p-3 bg-gray-100 rounded">
        <summary className="font-medium cursor-pointer">Debug: Current Configuration</summary>
        <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Start Simulation
        </button>
      </div>
    </div>
  );
};

export default ParameterControls;