// DebugInterface.jsx
import React, { useState, useRef } from 'react';
import { SimulationManager } from '../simulation/SimulationManager';
import EcosystemVisualization from './EcosystemVisualization';
import ParameterControls from './ParameterControls';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DebugInterface = () => {
  const [mode, setMode] = useState('select'); // 'select', 'visualize', or 'debug'
  const [debugOutput, setDebugOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [simulationData, setSimulationData] = useState([]);
  const [debugLogs, setDebugLogs] = useState([]);
  const consoleLogRef = useRef(console.log);
  const consoleWarnRef = useRef(console.warn);
  const consoleErrorRef = useRef(console.error);

  const defaultConfig = {
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
  };

  const addLog = (message) => {
    setDebugLogs(prev => [...prev, {
      time: new Date().toISOString(),
      message: typeof message === 'object' ? JSON.stringify(message) : message
    }]);
  };

  const exportToCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Year,Trees,Deer,Wolves,TreeAvgAge,DeerAvgAge,WolfAvgAge,TreeDeaths,DeerDeaths,WolfDeaths,YoungTrees\n" +
      simulationData.map(row => {
        return [
          row.year,
          row.trees,
          row.deer,
          row.wolves,
          row.treeAvgAge?.toFixed(2) || 0,
          row.deerAvgAge?.toFixed(2) || 0,
          row.wolfAvgAge?.toFixed(2) || 0,
          row.treeDeaths || 0,
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

  const runDebugSimulation = async (config) => {
    setIsRunning(true);
    setDebugOutput([]);
    setSimulationData([]);
    setDebugLogs([]);
    
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
    
    const simulation = new SimulationManager(config, 'normal');
    const debugData = [];
    
    addLog('Starting simulation with config: ' + JSON.stringify(config, null, 2));
    
    try {
      simulation.initialize();
      addLog('Initialization complete');
      
      // Run stabilization period
      for (let i = 0; i < config.stabilizationYears; i++) {
        const stats = simulation.getCurrentStats();
        if (i % 10 === 0) {
          addLog(`Stabilization Year ${i}: Trees=${stats.trees.total} (Avg Age: ${stats.trees.averageAge.toFixed(1)})`);
        }
        
        debugData.push({
          year: -config.stabilizationYears + i,
          phase: 'stabilization',
          trees: stats.trees.total,
          deer: 0,
          wolves: 0,
          treeAvgAge: stats.trees.averageAge,
          youngTrees: stats.trees.youngTrees || 0
        });
        
        setSimulationData([...debugData]);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Main simulation
      for (let year = 0; year < config.years; year++) {
        setCurrentYear(year);
        const yearStats = simulation.simulateYear();
        
        const yearData = {
          year,
          phase: 'simulation',
          trees: yearStats.trees.total,
          deer: yearStats.deer.total,
          wolves: yearStats.wolves.total,
          treeAvgAge: yearStats.trees.averageAge,
          deerAvgAge: yearStats.deer.averageAge,
          wolfAvgAge: yearStats.wolves.averageAge,
          treeDeaths: yearStats.trees.deaths || 0,
          deerDeaths: yearStats.deer.deaths || 0,
          wolfDeaths: yearStats.wolves.deaths || 0,
          youngTrees: yearStats.trees.youngTrees || 0
        };
        
        debugData.push(yearData);
        setSimulationData([...debugData]);
        
        if (year % 5 === 0) {
          addLog(`Year ${year} Complete:
            Trees: ${yearStats.trees.total} (Avg Age: ${yearStats.trees.averageAge.toFixed(1)}, Deaths: ${yearStats.trees.deaths || 0})
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
        defaultConfig={defaultConfig}
        onStart={runDebugSimulation}
      />
      
      {isRunning && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-lg">Simulation Running - Year: {currentYear}</p>
        </div>
      )}
      
      {(debugOutput.length > 0 || simulationData.length > 0) && (
        <div className="mt-8 space-y-6">
          {/* TREE POPULATION GRAPH */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-green-700">Tree Population</h2>
            <div className="h-64 border rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={simulationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="trees" stroke="#2ecc71" name="Trees" dot={false} />
                  <Line type="monotone" dataKey="youngTrees" stroke="#27ae60" name="Young Trees" strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DEER POPULATION GRAPH */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-orange-700">Deer Population</h2>
            <div className="h-64 border rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={simulationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="deer" stroke="#e67e22" name="Deer" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WOLF POPULATION GRAPH */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Wolf Population</h2>
            <div className="h-64 border rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={simulationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="wolves" stroke="#7f8c8d" name="Wolves" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex space-x-4">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugInterface;