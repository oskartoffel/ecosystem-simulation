import React, { useState } from 'react';

const ImprovedParameterControls = ({ defaultConfig, onStart }) => {
  const [config, setConfig] = useState(defaultConfig);
  const [activeTab, setActiveTab] = useState('general');
  const [isConfiguring, setIsConfiguring] = useState(true);

  const handleChange = (category, parameter, value) => {
    if (category === 'general') {
      setConfig(prev => ({
        ...prev,
        [parameter]: Number(value)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [parameter]: Number(value)
        }
      }));
    }
  };

  const handleSubmit = () => {
    setIsConfiguring(false);
    onStart(config);
  };

  // Common input field component to ensure consistent styling and behavior
  const ParameterInput = ({ category, param, value, label, min, max, step = 1 }) => (
    <div className="mb-3">
      <label className="flex items-center justify-between text-sm">
        <span className="font-medium">{label || param}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(category, param, e.target.value)}
          className="w-24 ml-2 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          min={min}
          max={max}
          step={step}
          disabled={!isConfiguring}
        />
      </label>
    </div>
  );

  if (!isConfiguring) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full mb-4">
      <h2 className="text-xl font-bold mb-4">Simulation Parameters</h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'tree' ? 'border-b-2 border-green-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('tree')}
        >
          Trees
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'deer' ? 'border-b-2 border-orange-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('deer')}
        >
          Deer
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'wolf' ? 'border-b-2 border-red-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('wolf')}
        >
          Wolves
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="overflow-y-auto max-h-80 p-2">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-700 mb-3">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ParameterInput 
                category="general" 
                param="gridSize" 
                value={config.gridSize} 
                label="Grid Size" 
                min={1000} 
                max={50000}
              />
              <ParameterInput 
                category="general" 
                param="years" 
                value={config.years} 
                label="Years to Simulate" 
                min={1} 
                max={1000}
              />
              <ParameterInput 
                category="general" 
                param="stabilizationYears" 
                value={config.stabilizationYears} 
                label="Stabilization Years" 
                min={0} 
                max={200}
              />
            </div>
          </div>
        )}

        {/* Tree Parameters */}
        {activeTab === 'tree' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-700 mb-3">Tree Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ParameterInput 
                category="tree" 
                param="initial" 
                value={config.tree.initial} 
                label="Initial Population" 
                min={100} 
                max={10000}
              />
              <ParameterInput 
                category="tree" 
                param="density" 
                value={config.tree.density} 
                label="Density (1-20)" 
                min={1} 
                max={20}
              />
              <ParameterInput 
                category="tree" 
                param="ageAvg" 
                value={config.tree.ageAvg} 
                label="Average Initial Age" 
                min={1} 
                max={100}
              />
              <ParameterInput 
                category="tree" 
                param="ageSigma" 
                value={config.tree.ageSigma} 
                label="Age Variation" 
                min={1} 
                max={50}
              />
              <ParameterInput 
                category="tree" 
                param="maturity" 
                value={config.tree.maturity} 
                label="Maturity Age" 
                min={1} 
                max={50}
              />
              <ParameterInput 
                category="tree" 
                param="stressLevel" 
                value={config.tree.stressLevel} 
                label="Stress Level (1-10)" 
                min={1} 
                max={10}
              />
              <ParameterInput 
                category="tree" 
                param="reproductionFactor" 
                value={config.tree.reproductionFactor} 
                label="Reproduction (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="tree" 
                param="edibleAge" 
                value={config.tree.edibleAge} 
                label="Max Edible Age" 
                min={1} 
                max={20}
              />
            </div>
          </div>
        )}

        {/* Deer Parameters */}
        {activeTab === 'deer' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-orange-700 mb-3">Deer Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ParameterInput 
                category="deer" 
                param="initial" 
                value={config.deer.initial} 
                label="Initial Population" 
                min={1} 
                max={500}
              />
              <ParameterInput 
                category="deer" 
                param="maturity" 
                value={config.deer.maturity} 
                label="Maturity Age" 
                min={1} 
                max={10}
              />
              <ParameterInput 
                category="deer" 
                param="staminaFactor" 
                value={config.deer.staminaFactor} 
                label="Stamina Factor (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="deer" 
                param="hungerFactor" 
                value={config.deer.hungerFactor} 
                label="Hunger Factor (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="deer" 
                param="reproductionFactor" 
                value={config.deer.reproductionFactor} 
                label="Reproduction (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="deer" 
                param="migrationFactor" 
                value={config.deer.migrationFactor} 
                label="Migration Factor (1-10)" 
                min={0} 
                max={10}
                step={0.1}
              />
            </div>
          </div>
        )}

        {/* Wolf Parameters */}
        {activeTab === 'wolf' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-red-700 mb-3">Wolf Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ParameterInput 
                category="wolf" 
                param="initial" 
                value={config.wolf.initial} 
                label="Initial Population" 
                min={1} 
                max={100}
              />
              <ParameterInput 
                category="wolf" 
                param="maturity" 
                value={config.wolf.maturity} 
                label="Maturity Age" 
                min={1} 
                max={10}
              />
              <ParameterInput 
                category="wolf" 
                param="staminaFactor" 
                value={config.wolf.staminaFactor} 
                label="Stamina Factor (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="wolf" 
                param="hungerFactor" 
                value={config.wolf.hungerFactor} 
                label="Hunger Factor (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="wolf" 
                param="reproductionFactor" 
                value={config.wolf.reproductionFactor} 
                label="Reproduction (1-10)" 
                min={1} 
                max={10}
                step={0.1}
              />
              <ParameterInput 
                category="wolf" 
                param="migrationFactor" 
                value={config.wolf.migrationFactor} 
                label="Migration Factor (1-10)" 
                min={0} 
                max={10}
                step={0.1}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Start Simulation
        </button>
      </div>
    </div>
  );
};

export default ImprovedParameterControls;