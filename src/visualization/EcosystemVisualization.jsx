// EcosystemVisualization.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SimulationManager } from '../simulation/SimulationManager';

const EcosystemVisualization = () => {
  const [simulationData, setSimulationData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
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
      staminaFactor: 100000.0,
      hungerFactor: 2.0
    },
    wolf: {
      initial: 5,
      arraySize: 100,
      maturity: 2,
      staminaFactor: 30,
      hungerFactor: 1.0
    }
  });

  const handleConfigChange = (category, parameter, value) => {
    setConfig(prev => {
      if (category === 'general') {
        return { ...prev, [parameter]: Number(value) };
      }
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [parameter]: Number(value)
        }
      };
    });
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setSimulationData([]);
    
    const simulation = new SimulationManager(config, 'visualization');
    simulation.initialize();
    const data = [];

    for (let year = 0; year < config.years; year++) {
      const yearStats = simulation.simulateYear();
      const yearData = {
        year,
        trees: yearStats.trees.total,
        youngTrees: yearStats.trees.youngTrees || 0,
        deer: yearStats.deer.total,
        wolves: yearStats.wolves.total
      };
      
      data.push(yearData);
      setSimulationData([...data]);
      setCurrentYear(year);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsRunning(false);
  };

  const ConfigControl = ({ category, param, value, label }) => (
    <div className="mb-2">
      <label className="block text-sm">
        {label || param}
        <input
          type="number"
          value={value}
          onChange={(e) => handleConfigChange(category, param, e.target.value)}
          className="w-full mt-1 px-2 py-1 border rounded"
          disabled={isRunning}
        />
      </label>
    </div>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ecosystem Simulation</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={isRunning}
          >
            {showConfig ? 'Hide Parameters' : 'Show Parameters'}
          </button>
          <button 
            onClick={runSimulation}
            disabled={isRunning}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
          >
            {isRunning ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold mb-2">General</h3>
              <ConfigControl category="general" param="years" value={config.years} label="Simulation Years" />
              <ConfigControl category="general" param="stabilizationYears" value={config.stabilizationYears} label="Stabilization Years" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Trees</h3>
              <ConfigControl category="tree" param="initial" value={config.tree.initial} label="Initial Population" />
              <ConfigControl category="tree" param="density" value={config.tree.density} label="Density" />
              <ConfigControl category="tree" param="maturity" value={config.tree.maturity} label="Maturity Age" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-700 mb-2">Deer</h3>
              <ConfigControl category="deer" param="initial" value={config.deer.initial} label="Initial Population" />
              <ConfigControl category="deer" param="maturity" value={config.deer.maturity} label="Maturity Age" />
              <ConfigControl category="deer" param="hungerFactor" value={config.deer.hungerFactor} label="Hunger Factor" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Wolves</h3>
              <ConfigControl category="wolf" param="initial" value={config.wolf.initial} label="Initial Population" />
              <ConfigControl category="wolf" param="maturity" value={config.wolf.maturity} label="Maturity Age" />
              <ConfigControl category="wolf" param="hungerFactor" value={config.wolf.hungerFactor} label="Hunger Factor" />
            </div>
          </div>
        </div>
      )}
      
      {isRunning && (
        <div className="text-lg mb-4">
          Year: {currentYear}
        </div>
      )}

      {/* Combined population graph */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Population Dynamics</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="trees" name="Trees" stroke="#2ecc71" dot={false} />
              <Line type="monotone" dataKey="youngTrees" name="Young Trees" stroke="#27ae60" dot={false} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="deer" name="Deer" stroke="#e67e22" dot={false} />
              <Line type="monotone" dataKey="wolves" name="Wolves" stroke="#7f8c8d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current stats cards */}
      {simulationData.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-800">Trees</h3>
            <p>Total: {simulationData[simulationData.length - 1].trees}</p>
            <p>Young: {simulationData[simulationData.length - 1].youngTrees}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-bold text-orange-800">Deer</h3>
            <p>Population: {simulationData[simulationData.length - 1].deer}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800">Wolves</h3>
            <p>Population: {simulationData[simulationData.length - 1].wolves}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcosystemVisualization;