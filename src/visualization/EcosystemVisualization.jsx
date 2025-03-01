// EcosystemVisualization.jsx - With parameter management functionality
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SimulationManager } from '../simulation/SimulationManager';
import ParameterSaveDialog from './ParameterSaveDialog';
import ParameterManager from '../utils/ParameterManager';

const defaultConfig = {
  gridSize: 10000,
  years: 20,
  stabilizationYears: 10,
  tree: {
    initial: 1000,
    arraySize: 10000,
    density: 15,
    ageAvg: 30,
    ageSigma: 20,
    maturity: 10,
    stressIndex: 85
  },
  deer: {
    initial: 20,
    arraySize: 500,
    maturity: 2,
    staminaFactor: 5.0,
    hungerFactor: 5.0,
    migrationFactor: 1.0
  },
  wolf: {
    initial: 5,
    arraySize: 200,
    maturity: 2,
    staminaFactor: 5.0,
    hungerFactor: 1.0,
    migrationFactor: 0.5
  }
};

const EcosystemVisualization = () => {
  // Load saved parameters or use defaults
  const loadInitialConfig = () => {
    const savedParams = ParameterManager.loadParameters();
    return savedParams || defaultConfig;
  };

  const [simulationData, setSimulationData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(loadInitialConfig());
  
  // Parameter save dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(null);

  // Effect to load saved parameters on component mount
  useEffect(() => {
    const savedParams = ParameterManager.loadParameters();
    if (savedParams) {
      setConfig(savedParams);
    }
  }, []);

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
    
    // Store current config temporarily (will be saved if user requests)
    setTempConfig({...config});
    
    const simulation = new SimulationManager(config, 'visualization');
    simulation.initialize();
    const data = [];

    // Create empty data points for all years to set the domain properly
    for (let year = 0; year < config.years; year++) {
      data.push({
        year,
        trees: null,
        youngTrees: null,
        deer: null,
        wolves: null,
        treeAvgAge: null,
        deerAvgAge: null,
        wolfAvgAge: null
      });
    }
    setSimulationData([...data]);

    // Now run the actual simulation
    for (let year = 0; year < config.years; year++) {
      const yearStats = simulation.simulateYear();
      data[year] = {
        year,
        trees: yearStats.trees.total,
        youngTrees: yearStats.trees.youngTrees || 0,
        treeDeaths: yearStats.trees.deaths || 0,                // Total deaths including eaten by deer
        treeConsumedByDeer: yearStats.trees.consumedByDeer || 0, // Trees eaten by deer
        treeStressDeaths: yearStats.trees.stressDeaths || 0,     // Tree stress deaths
        treeAgeDeaths: yearStats.trees.ageDeaths || 0,           // Tree age deaths
        treeConcurrenceDeaths: yearStats.trees.concurrenceDeaths || 0, // Tree concurrence deaths
        deer: yearStats.deer.total,
        wolves: yearStats.wolves.total,
        treeAvgAge: yearStats.trees.averageAge,
        deerAvgAge: yearStats.deer.averageAge,
        wolfAvgAge: yearStats.wolves.averageAge,
        currentYear: true // Mark the current year for visualization
      };
      
      // Remove currentYear marker from previous years
      if (year > 0) {
        data[year - 1].currentYear = false;
      }
      
      setSimulationData([...data]);
      setCurrentYear(year);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsRunning(false);
    
    // No longer automatically open dialog - user will click button when ready
  };

  // Dialog handlers
  const handleSaveParameters = () => {
    if (tempConfig) {
      ParameterManager.saveParameters(tempConfig);
      setConfig(tempConfig); // Update current config
    }
    setIsDialogOpen(false);
  };

  const handleDownloadParameters = () => {
    if (tempConfig) {
      ParameterManager.downloadParametersJS(tempConfig);
    }
    setIsDialogOpen(false);
  };

  const handleDiscardParameters = () => {
    setTempConfig(null);
    setIsDialogOpen(false);
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
      "Year,Trees,YoungTrees,TreeDeaths,TreeConsumedByDeer,Deer,Wolves,TreeAvgAge,DeerAvgAge,WolfAvgAge\n" +
      simulationData.filter(row => row.trees !== null).map(row => {
        return [
          row.year,
          row.trees,
          row.youngTrees || 0,
          row.treeDeaths || 0,            // Total tree deaths
          row.treeConsumedByDeer || 0,    // Trees eaten by deer
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

  // Function for chart dot rendering - only show dot for current year
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.currentYear) {
      return (
        <circle cx={cx} cy={cy} r={4} fill="#000" stroke="none" />
      );
    }
    return null;
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
              <ConfigControl category="tree" param="density" value={config.tree.density} label="Density" />
              <ConfigControl category="tree" param="maturity" value={config.tree.maturity} label="Maturity Age" />
              <ConfigControl category="tree" param="stressIndex" value={config.tree.stressIndex} label="Stress Index" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-700 mb-2">Deer</h3>
              <ConfigControl category="deer" param="initial" value={config.deer.initial} label="Initial Population" />
              <ConfigControl category="deer" param="maturity" value={config.deer.maturity} label="Maturity Age" />
              <ConfigControl category="deer" param="hungerFactor" value={config.deer.hungerFactor} label="Hunger Factor" />
              <ConfigControl category="deer" param="staminaFactor" value={config.deer.staminaFactor} label="Stamina Factor" />
              <ConfigControl category="deer" param="migrationFactor" value={config.deer.migrationFactor} label="Migration Factor" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Wolves</h3>
              <ConfigControl category="wolf" param="initial" value={config.wolf.initial} label="Initial Population" />
              <ConfigControl category="wolf" param="maturity" value={config.wolf.maturity} label="Maturity Age" />
              <ConfigControl category="wolf" param="hungerFactor" value={config.wolf.hungerFactor} label="Hunger Factor" />
              <ConfigControl category="wolf" param="staminaFactor" value={config.wolf.staminaFactor} label="Stamina Factor" />
              <ConfigControl category="wolf" param="migrationFactor" value={config.wolf.migrationFactor} label="Migration Factor" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => ParameterManager.downloadParametersJS(config)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isRunning}
            >
              Download Current Parameters
            </button>
          </div>
        </div>
      )}
      
      {isRunning && (
        <div className="text-lg mb-4">
          Year: {currentYear}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tree population graph */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2 text-green-700">Tree Population</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  domain={[0, config.years - 1]}
                  type="number"
                  allowDataOverflow={true}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="trees" 
                  name="Trees" 
                  stroke="#2ecc71" 
                  connectNulls={true}
                  dot={renderDot}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="youngTrees" 
                  name="Young Trees" 
                  stroke="#27ae60" 
                  strokeDasharray="3 3" 
                  connectNulls={true}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deer population graph */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2 text-orange-700">Deer Population</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  domain={[0, config.years - 1]}
                  type="number"
                  allowDataOverflow={true}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="deer" 
                  name="Deer" 
                  stroke="#e67e22" 
                  connectNulls={true}
                  dot={renderDot}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wolf population graph */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Wolf Population</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  domain={[0, config.years - 1]}
                  type="number"
                  allowDataOverflow={true}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="wolves" 
                  name="Wolves" 
                  stroke="#7f8c8d" 
                  connectNulls={true}
                  dot={renderDot}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Current stats cards and download button */}
      {simulationData.length > 0 && simulationData[currentYear]?.trees !== null && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-green-800">Trees</h3>
              <p>Total: {simulationData[currentYear].trees}</p>
              <p>Young: {simulationData[currentYear].youngTrees || 0}</p>
              <p>Avg Age: {simulationData[currentYear].treeAvgAge?.toFixed(1) || 0}</p>
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="font-semibold">Death Breakdown:</p>
                <p>Total Deaths: {simulationData[currentYear].treeDeaths || 0}</p>
                <p>• Consumed by Deer: {simulationData[currentYear].treeConsumedByDeer || 0}</p>
                <p>• Age Deaths: {simulationData[currentYear].treeAgeDeaths || 0}</p>
                <p>• Stress Deaths: {simulationData[currentYear].treeStressDeaths || 0}</p>
                <p>• Concurrence: {simulationData[currentYear].treeConcurrenceDeaths || 0}</p>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-bold text-orange-800">Deer</h3>
              <p>Population: {simulationData[currentYear].deer}</p>
              <p>Avg Age: {simulationData[currentYear].deerAvgAge?.toFixed(1) || 0}</p>
              <p>Deaths: {simulationData[currentYear].deerDeaths || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800">Wolves</h3>
              <p>Population: {simulationData[currentYear].wolves}</p>
              <p>Avg Age: {simulationData[currentYear].wolfAvgAge?.toFixed(1) || 0}</p>
              <p>Deaths: {simulationData[currentYear].wolfDeaths || 0}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download CSV Data
            </button>
            
            {/* Parameter management buttons */}
            <button
              onClick={() => setIsDialogOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save Parameters
            </button>
            
            <button
              onClick={() => ParameterManager.downloadParametersJS(tempConfig || config)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Download Parameters
            </button>
          </div>
        </div>
      )}

      {/* Parameter Save Dialog */}
      <ParameterSaveDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveParameters}
        onDownload={handleDownloadParameters}
        onDiscard={handleDiscardParameters}
      />
    </div>
  );
};

export default EcosystemVisualization;