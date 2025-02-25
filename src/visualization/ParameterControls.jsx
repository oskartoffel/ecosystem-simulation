import React, { useState } from 'react';

const ParameterControls = ({ defaultConfig, onStart }) => {
  const [config, setConfig] = useState(defaultConfig);
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

  if (!isConfiguring) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mb-4">
      <h2 className="text-xl font-bold mb-4">Simulation Parameters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* General Parameters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-blue-700">General Settings</h3>
          <div className="space-y-2">
            <label className="block">
              Grid Size
              <input
                type="number"
                value={config.gridSize}
                onChange={(e) => handleChange('general', 'gridSize', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Years to Simulate
              <input
                type="number"
                value={config.years}
                onChange={(e) => handleChange('general', 'years', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Stabilization Years
              <input
                type="number"
                value={config.stabilizationYears}
                onChange={(e) => handleChange('general', 'stabilizationYears', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
          </div>
        </div>

        {/* Tree Parameters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-green-700">Trees</h3>
          <div className="space-y-2">
            <label className="block">
              Initial Population
              <input
                type="number"
                value={config.tree.initial}
                onChange={(e) => handleChange('tree', 'initial', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Density
              <input
                type="number"
                value={config.tree.density}
                onChange={(e) => handleChange('tree', 'density', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Average Age
              <input
                type="number"
                value={config.tree.ageAvg}
                onChange={(e) => handleChange('tree', 'ageAvg', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Maturity Age
              <input
                type="number"
                value={config.tree.maturity}
                onChange={(e) => handleChange('tree', 'maturity', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Stress Index
              <input
                type="number"
                value={config.tree.stressIndex}
                onChange={(e) => handleChange('tree', 'stressIndex', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
          </div>
        </div>

        {/* Deer Parameters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-orange-700">Deer</h3>
          <div className="space-y-2">
            <label className="block">
              Initial Population
              <input
                type="number"
                value={config.deer.initial}
                onChange={(e) => handleChange('deer', 'initial', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Maturity Age
              <input
                type="number"
                value={config.deer.maturity}
                onChange={(e) => handleChange('deer', 'maturity', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Stamina Factor
              <input
                type="number"
                value={config.deer.staminaFactor}
                onChange={(e) => handleChange('deer', 'staminaFactor', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Hunger Factor
              <input
                type="number"
                value={config.deer.hungerFactor}
                onChange={(e) => handleChange('deer', 'hungerFactor', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
          </div>
        </div>

        {/* Wolf Parameters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-red-700">Wolves</h3>
          <div className="space-y-2">
            <label className="block">
              Initial Population
              <input
                type="number"
                value={config.wolf.initial}
                onChange={(e) => handleChange('wolf', 'initial', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Maturity Age
              <input
                type="number"
                value={config.wolf.maturity}
                onChange={(e) => handleChange('wolf', 'maturity', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Stamina Factor
              <input
                type="number"
                value={config.wolf.staminaFactor}
                onChange={(e) => handleChange('wolf', 'staminaFactor', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Hunger Factor
              <input
                type="number"
                value={config.wolf.hungerFactor}
                onChange={(e) => handleChange('wolf', 'hungerFactor', e.target.value)}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Simulation
        </button>
      </div>
    </div>
  );
};

export default ParameterControls;