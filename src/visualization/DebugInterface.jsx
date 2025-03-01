// DebugInterface.jsx - With parameter management functionality
import React, { useState, useRef, useEffect } from 'react';
import { SimulationManager } from '../simulation/SimulationManager';
import EcosystemVisualization from './EcosystemVisualization';
import ParameterControls from './ParameterControls';
import ParameterSaveDialog from './ParameterSaveDialog';
import ParameterManager from '../utils/ParameterManager';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DebugInterface = () => {
  const [mode, setMode] = useState('select'); // 'select', 'visualize', or 'debug'
  const [debugOutput, setDebugOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [simulationData, setSimulationData] = useState([]);
  const [debugLogs, setDebugLogs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(null);
  
  const consoleLogRef = useRef(console.log);
  const consoleWarnRef = useRef(console.warn);
  const consoleErrorRef = useRef(console.error);

  // Load saved parameters or use defaults
  const loadInitialConfig = () => {
    const savedParams = ParameterManager.loadParameters();
    return savedParams || defaultConfig;
  };

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

  // State for config
  const [config, setConfig] = useState(loadInitialConfig());

  // Effect to load saved parameters on component mount
  useEffect(() => {
    const savedParams = ParameterManager.loadParameters();
    if (savedParams) {
      setConfig(savedParams);
    }
  }, []);

  const addLog = (message) => {
    setDebugLogs(prev => [...prev, {
      time: new Date().toISOString(),
      message: typeof message === 'object' ? JSON.stringify(message) : message
    }]);
  };

  const exportToCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Year,Trees,Deer,Wolves,TreeAvgAge,DeerAvgAge,WolfAvgAge,TreeDeaths,TreeConsumed,TreeStressDeaths,TreeAgeDeaths,TreeConcurrenceDeaths,DeerDeaths,WolfDeaths,YoungTrees\n" +
      simulationData
        .filter(row => row.phase !== 'stabilization') // Filter out stabilization years
        .map(row => {
          return [
            row.year,
            row.trees,
            row.deer,
            row.wolves,
            row.treeAvgAge?.toFixed(2) || 0,
            row.deerAvgAge?.toFixed(2) || 0,
            row.wolfAvgAge?.toFixed(2) || 0,
            row.treeDeaths || 0,            // Total tree deaths (includes consumed)
            row.treeConsumedByDeer || 0,    // Trees eaten by deer
            row.treeStressDeaths || 0,      // Tree stress deaths
            row.treeAgeDeaths || 0,         // Tree age deaths
            row.treeConcurrenceDeaths || 0, // Tree concurrence deaths
            row.deerDeaths || 0,
            row.wolfDeaths || 0,
            row.youngTrees || 0
          ].join(",");
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecosystem_debug.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLogs = () => {
    const logContent = "data:text/plain;charset=utf-8," + 
      debugLogs.map(log => `[${log.time}] ${log.message}`).join('\n');
    
    const encodedUri = encodeURI(logContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecosystem_debug.log");
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

  const runDebugSimulation = async (simulationConfig) => {
    setIsRunning(true);
    setDebugOutput([]);
    setSimulationData([]);
    setDebugLogs([]);
    
    // Store config for potential saving later
    setTempConfig({...simulationConfig});
    setConfig(simulationConfig); // Use the new config for this run
    
    // Intercept console logs to capture in our debug logs
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ');
      addLog(message);
      consoleLogRef.current(...args);
    };
    
    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ');
      addLog(`WARNING: ${message}`);
      consoleWarnRef.current(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ');
      addLog(`ERROR: ${message}`);
      consoleErrorRef.current(...args);
    };
    
    const simulation = new SimulationManager(simulationConfig, 'normal');
    const debugData = [];
    
    addLog('Starting simulation with config: ' + JSON.stringify(simulationConfig, null, 2));
    
    try {
      simulation.initialize();
      addLog('Initialization complete');
      
      // Run stabilization period (don't add to graph data anymore)
      for (let i = 0; i < simulationConfig.stabilizationYears; i++) {
        const stats = simulation.getCurrentStats();
        if (i % 10 === 0) {
          addLog(`Stabilization Year ${i}: Trees=${stats.trees.total} (Avg Age: ${stats.trees.averageAge.toFixed(1)})`);
        }
        
        // We no longer add stabilization data to the graph
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Create empty data points for all years to set the domain properly
      for (let year = 0; year < simulationConfig.years; year++) {
        debugData.push({
          year,
          phase: 'simulation',
          trees: null,
          deer: null,
          wolves: null,
          treeAvgAge: null,
          deerAvgAge: null,
          wolfAvgAge: null,
          treeDeaths: null,
          deerDeaths: null,
          wolfDeaths: null,
          youngTrees: null
        });
      }
      setSimulationData([...debugData]);
      
      // Main simulation
      for (let year = 0; year < simulationConfig.years; year++) {
        setCurrentYear(year);
        const yearStats = simulation.simulateYear();
        
        debugData[year] = {
          year,
          phase: 'simulation',
          trees: yearStats.trees.total,
          deer: yearStats.deer.total,
          wolves: yearStats.wolves.total,
          treeAvgAge: yearStats.trees.averageAge,
          deerAvgAge: yearStats.deer.averageAge,
          wolfAvgAge: yearStats.wolves.averageAge,
          treeDeaths: yearStats.trees.deaths || 0,                // Total deaths including eaten by deer
          treeConsumedByDeer: yearStats.trees.consumedByDeer || 0, // Trees eaten by deer
          treeStressDeaths: yearStats.trees.stressDeaths || 0,     // Tree stress deaths
          treeAgeDeaths: yearStats.trees.ageDeaths || 0,           // Tree age deaths
          treeConcurrenceDeaths: yearStats.trees.concurrenceDeaths || 0, // Tree concurrence deaths
          deerDeaths: yearStats.deer.deaths || 0,
          wolfDeaths: yearStats.wolves.deaths || 0,
          youngTrees: yearStats.trees.youngTrees || 0,
          currentYear: true // Mark the current year for visualization
        };
        
        // Remove currentYear marker from previous years
        if (year > 0) {
          debugData[year - 1].currentYear = false;
        }
        
        setSimulationData([...debugData]);
        
        if (year % 5 === 0) {
          addLog(`Year ${year} Complete:
            Trees: ${yearStats.trees.total} (Avg Age: ${yearStats.trees.averageAge.toFixed(1)}, Deaths: ${yearStats.trees.deaths || 0}, Consumed: ${yearStats.trees.consumedByDeer || 0})
            Deer: ${yearStats.deer.total} (Avg Age: ${yearStats.deer.averageAge.toFixed(1)}, Deaths: ${yearStats.deer.deaths || 0})
            Wolves: ${yearStats.wolves.total} (Avg Age: ${yearStats.wolves.averageAge.toFixed(1)}, Deaths: ${yearStats.wolves.deaths || 0})`
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setDebugOutput(debugData);
      
    } catch (error) {
      addLog('Simulation Error: ' + error.message);
      console.error('Simulation Error:', error);
    } finally {
      // Restore original console methods
      console.log = consoleLogRef.current;
      console.warn = consoleWarnRef.current;
      console.error = consoleErrorRef.current;
      setIsRunning(false);
      
      // No longer automatically open dialog - user will click button when ready
    }
  };

  if (mode === 'select') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Ecosystem Simulation</h1>
        <div className="grid grid-cols-2 gap-8">
          <button
            onClick={() => setMode('visualize')}
            className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-4">Visualization Mode</h2>
            <p>Run the full simulation with real-time population graphs</p>
          </button>
          
          <button
            onClick={() => setMode('debug')}
            className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-4">Debug Mode</h2>
            <p>Run a shorter simulation with detailed logging and CSV export</p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'visualize') {
    return <EcosystemVisualization />;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => setMode('select')}
        className="mb-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
      >
        ← Back to Mode Selection
      </button>
      
      <h1 className="text-2xl font-bold mb-8">Debug Mode</h1>
      
      <ParameterControls
        defaultConfig={config}
        onStart={runDebugSimulation}
      />
      
      {isRunning && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-lg">Simulation Running - Year: {currentYear}</p>
        </div>
      )}
      
      {(debugOutput.length > 0 || simulationData.length > 0) && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TREE POPULATION GRAPH */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2 text-green-700">Tree Population</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulationData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
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
                      stroke="#2ecc71" 
                      name="Trees" 
                      connectNulls={true} 
                      dot={renderDot}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="youngTrees" 
                      stroke="#27ae60" 
                      name="Young Trees" 
                      strokeDasharray="3 3" 
                      connectNulls={true}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DEER POPULATION GRAPH */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2 text-orange-700">Deer Population</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulationData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
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
                      stroke="#e67e22" 
                      name="Deer" 
                      connectNulls={true} 
                      dot={renderDot}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WOLF POPULATION GRAPH */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Wolf Population</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulationData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
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
                      stroke="#7f8c8d" 
                      name="Wolves" 
                      connectNulls={true} 
                      dot={renderDot}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Current stats cards */}
          {simulationData.length > 0 && simulationData[currentYear]?.trees !== null && (
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
          )}


          {/* Download buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCsv}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download CSV Data
            </button>
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Download Log File
            </button>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
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

export default DebugInterface;