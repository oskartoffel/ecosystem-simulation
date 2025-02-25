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
    years: 20,  // or appropriate value
    stabilizationYears: 10,
    tree: {
      initial: 1000,
      arraySize: 10000,
      density: 15,
      ageAvg: 30,
      ageSigma: 20,
      maturity: 10,
      stressIndex: 85  // Slightly lower than 90 to allow more young trees
    },
    deer: {
      initial: 20,
      arraySize: 500,  // Increased from 200
      maturity: 2,
      staminaFactor: 10000.0,  // Reduced from 100000.0
      hungerFactor: 5.0,       // Increased from 2.0
      migrationFactor: 1.0     // New parameter
    },
    wolf: {
      initial: 5,
      arraySize: 200,  // Increased from 100
      maturity: 2,
      staminaFactor: 300.0,  // Adjusted
      hungerFactor: 1.0,
      migrationFactor: 0.5   // New parameter
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
        wolves: yearStats.wolves.total,
        treeAvgAge: yearStats.trees.averageAge,
        deerAvgAge: yearStats.deer.averageAge,
        wolfAvgAge: yearStats.wolves.averageAge
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

  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Year,Trees,YoungTrees,Deer,Wolves,TreeAvgAge,DeerAvgAge,WolfAvgAge\n" +
      simulationData.map(row => {
        return [
          row.year,
          row.trees,
          row.youngTrees || 0,
          row.deer,
          row.wolves,
          row.treeAvgAge?.toFixed(2) || 0,
          row.deerAvgAge?.toFixed(2) || 0,
          row.wolfAvgAge?.toFixed(2) || 0
        ].join(",");
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecosystem_simulation.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <ConfigControl category="general" param="gridSize" value={config.gridSize} label="Grid Size" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Trees</h3>
              <ConfigControl category="tree" param="initial" value={config.tree.initial} label="Initial Population" />
              <ConfigControl category="tree" param="arraySize" value={config.tree.arraySize} label="Array Size" />
              <ConfigControl category="tree" param="density" value={config.tree.density} label="Density" />
              <ConfigControl category="tree" param="maturity" value={config.tree.maturity} label="Maturity Age" />
              <ConfigControl category="tree" param="stressIndex" value={config.tree.stressIndex} label="Stress Index" />
              <ConfigControl category="tree" param="ageAvg" value={config.tree.ageAvg} label="Initial Age Avg" />
              <ConfigControl category="tree" param="ageSigma" value={config.tree.ageSigma} label="Age Variation" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-700 mb-2">Deer</h3>
              <ConfigControl category="deer" param="initial" value={config.deer.initial} label="Initial Population" />
              <ConfigControl category="deer" param="arraySize" value={config.deer.arraySize} label="Array Size" />
              <ConfigControl category="deer" param="maturity" value={config.deer.maturity} label="Maturity Age" />
              <ConfigControl category="deer" param="hungerFactor" value={config.deer.hungerFactor} label="Hunger Factor" />
              <ConfigControl category="deer" param="staminaFactor" value={config.deer.staminaFactor} label="Stamina Factor" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Wolves</h3>
              <ConfigControl category="wolf" param="initial" value={config.wolf.initial} label="Initial Population" />
              <ConfigControl category="wolf" param="arraySize" value={config.wolf.arraySize} label="Array Size" />
              <ConfigControl category="wolf" param="maturity" value={config.wolf.maturity} label="Maturity Age" />
              <ConfigControl category="wolf" param="hungerFactor" value={config.wolf.hungerFactor} label="Hunger Factor" />
              <ConfigControl category="wolf" param="staminaFactor" value={config.wolf.staminaFactor} label="Stamina Factor" />
            </div>
          </div>
        </div>
      )}
      
      {isRunning && (
        <div className="text-lg mb-4">
          Year: {currentYear}
        </div>
      )}

      {/* Tree population graph */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2 text-green-700">Tree Population</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="trees" name="Trees" stroke="#2ecc71" dot={false} />
              <Line type="monotone" dataKey="youngTrees" name="Young Trees" stroke="#27ae60" dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deer population graph */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2 text-orange-700">Deer Population</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="deer" name="Deer" stroke="#e67e22" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wolf population graph */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Wolf Population</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="wolves" name="Wolves" stroke="#7f8c8d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current stats cards and download button */}
      {simulationData.length > 0 && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-green-800">Trees</h3>
              <p>Total: {simulationData[simulationData.length - 1].trees}</p>
              <p>Young: {simulationData[simulationData.length - 1].youngTrees || 0}</p>
              <p>Avg Age: {simulationData[simulationData.length - 1].treeAvgAge?.toFixed(1) || 0}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-bold text-orange-800">Deer</h3>
              <p>Population: {simulationData[simulationData.length - 1].deer}</p>
              <p>Avg Age: {simulationData[simulationData.length - 1].deerAvgAge?.toFixed(1) || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800">Wolves</h3>
              <p>Population: {simulationData[simulationData.length - 1].wolves}</p>
              <p>Avg Age: {simulationData[simulationData.length - 1].wolfAvgAge?.toFixed(1) || 0}</p>
            </div>
          </div>
          
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download CSV Data
          </button>
        </div>
      )}
    </div>
  );
};

export default EcosystemVisualization;