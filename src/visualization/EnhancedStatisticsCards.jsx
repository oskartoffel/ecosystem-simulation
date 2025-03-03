import React from 'react';

// Reusable card component
const StatsCard = ({ title, color, children }) => (
  <div className={`bg-${color}-50 p-4 rounded-lg shadow-sm`}>
    <h3 className={`font-bold text-${color}-800 text-lg mb-3 pb-2 border-b border-${color}-200`}>
      {title}
    </h3>
    <div className="space-y-1.5">
      {children}
    </div>
  </div>
);

// Reusable stat row component
const StatRow = ({ label, value, highlight = false }) => (
  <div className={`flex justify-between items-center ${highlight ? 'font-medium' : ''}`}>
    <span>{label}</span>
    <span className={highlight ? 'font-semibold' : ''}>{value}</span>
  </div>
);

// A section for death causes
const DeathCausesSection = ({ title, causes }) => (
  <div className="mt-3 pt-2 border-t border-gray-200">
    <p className="font-semibold mb-1.5">{title}:</p>
    <div className="pl-2 space-y-1">
      {Object.entries(causes).map(([cause, value]) => (
        <StatRow 
          key={cause} 
          label={`• ${cause}`} 
          value={typeof value === 'number' ? value.toLocaleString() : value} 
        />
      ))}
    </div>
  </div>
);

// Calculates average across years
const calculateAverage = (data, years) => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / years;
};

// Processes simulation data to get enhanced statistics
const processStatistics = (simulationData, currentYear) => {
  if (!simulationData || simulationData.length === 0 || !simulationData[0]) {
    return null;
  }

  const years = currentYear + 1;
  
  // Get total deaths for each population type
  const totalTreeDeaths = simulationData.reduce((sum, year) => 
    sum + (year.treeDeaths || 0), 0);
  const totalDeerDeaths = simulationData.reduce((sum, year) => 
    sum + (year.deerDeaths || 0), 0);
  const totalWolfDeaths = simulationData.reduce((sum, year) => 
    sum + (year.wolfDeaths || 0), 0);
  
  // Calculate average populations
  const avgTrees = calculateAverage(
    simulationData.map(year => year.trees), 
    years
  );
  const avgDeer = calculateAverage(
    simulationData.map(year => year.deer), 
    years
  );
  const avgWolves = calculateAverage(
    simulationData.map(year => year.wolves), 
    years
  );
  
  // Death causes breakdown
  const treeConsumedDeaths = simulationData.reduce((sum, year) => 
    sum + (year.treeConsumedByDeer || 0), 0);
  const treeAgeDeaths = simulationData.reduce((sum, year) => 
    sum + (year.treeAgeDeaths || 0), 0);
  const treeStressDeaths = simulationData.reduce((sum, year) => 
    sum + (year.treeStressDeaths || 0), 0);
  const treeConcurrenceDeaths = simulationData.reduce((sum, year) => 
    sum + (year.treeConcurrenceDeaths || 0), 0);

  // Calculate average yearly deaths
  const avgTreeDeaths = totalTreeDeaths / years;
  const avgDeerDeaths = totalDeerDeaths / years;
  const avgWolfDeaths = totalWolfDeaths / years;

  // Extract current year's detailed data
  const currentData = simulationData[currentYear];
  
  // Calculate averages for migrations and reproductions
  const avgDeerMigrated = calculateAverage(
    simulationData.map(year => year.deerMigrated || 0),
    years
  );
  
  const avgDeerReproduced = calculateAverage(
    simulationData.map(year => year.deerReproduced || 0),
    years
  );
  
  const avgWolfMigrated = calculateAverage(
    simulationData.map(year => year.wolfMigrated || 0),
    years
  );
  
  const avgWolfReproduced = calculateAverage(
    simulationData.map(year => year.wolfReproduced || 0),
    years
  );
  
  // Debug logs to help find issues
  console.log('Current year data:', currentData);
  console.log('Tree consumed deaths:', treeConsumedDeaths);
  console.log('Deer migrations:', simulationData.map(year => year.deerMigrated || 0));
  console.log('Wolf migrations:', simulationData.map(year => year.wolfMigrated || 0));
  
  return {
    trees: {
      current: currentData.trees || 0,
      average: Math.round(avgTrees),
      totalDeaths: totalTreeDeaths,
      avgDeaths: Math.round(avgTreeDeaths),
      currentAvgAge: currentData.treeAvgAge?.toFixed(1) || 0,
      youngTrees: currentData.youngTrees || 0,
      deathCauses: {
        'Consumed by Deer': treeConsumedDeaths,
        'Age': treeAgeDeaths,
        'Stress': treeStressDeaths,
        'Concurrence': treeConcurrenceDeaths
      }
    },
    deer: {
      current: currentData.deer || 0,
      average: Math.round(avgDeer),
      totalDeaths: totalDeerDeaths,
      avgDeaths: Math.round(avgDeerDeaths),
      currentAvgAge: currentData.deerAvgAge?.toFixed(1) || 0,
      // Update these to use the current data and calculated averages
      foragingSuccess: currentData.deerForagingSuccess || 'N/A',
      migrated: Math.round(avgDeerMigrated),
      reproduced: Math.round(avgDeerReproduced),
      deathCauses: {
        'Age': currentData.deerAgeDeaths || 'N/A',
        'Starvation': currentData.deerStarvationDeaths || 'N/A',
        'Hunted': currentData.deerPredationDeaths || 'N/A'
      }
    },
    wolves: {
      current: currentData.wolves || 0,
      average: Math.round(avgWolves),
      totalDeaths: totalWolfDeaths,
      avgDeaths: Math.round(avgWolfDeaths),
      currentAvgAge: currentData.wolfAvgAge?.toFixed(1) || 0,
      // Update these to use the current data and calculated averages
      huntingSuccess: currentData.wolfHuntingSuccess || 'N/A',
      migrated: Math.round(avgWolfMigrated),
      reproduced: Math.round(avgWolfReproduced),
      deathCauses: {
        'Starvation': currentData.wolfStarvationDeaths || 'N/A',
        'Age': currentData.wolfAgeDeaths || 'N/A'
      }
    }
  };
};

const EnhancedStatisticsCards = ({ simulationData, currentYear }) => {
  const stats = processStatistics(simulationData, currentYear);
  
  if (!stats) return <div>No statistics available</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Tree Statistics Card */}
      <StatsCard title="Trees" color="green">
        <StatRow label="Current Population" value={stats.trees.current.toLocaleString()} highlight={true} />
        <StatRow label="Average Population" value={stats.trees.average.toLocaleString()} />
        <StatRow label="Young Trees" value={stats.trees.youngTrees.toLocaleString()} />
        <StatRow label="Current Avg Age" value={stats.trees.currentAvgAge} />
        <StatRow label="Total Deaths" value={stats.trees.totalDeaths.toLocaleString()} />
        <StatRow label="Avg Deaths/Year" value={stats.trees.avgDeaths.toLocaleString()} />
        
        <DeathCausesSection title="Death Causes" causes={stats.trees.deathCauses} />
      </StatsCard>
      
      {/* Deer Statistics Card */}
      <StatsCard title="Deer" color="orange">
        <StatRow label="Current Population" value={stats.deer.current.toLocaleString()} highlight={true} />
        <StatRow label="Average Population" value={stats.deer.average.toLocaleString()} />
        <StatRow label="Current Avg Age" value={stats.deer.currentAvgAge} />
        <StatRow label="Total Deaths" value={stats.deer.totalDeaths.toLocaleString()} />
        <StatRow label="Avg Deaths/Year" value={stats.deer.avgDeaths.toLocaleString()} />
        
        {/* These would need data from your simulation */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="font-semibold mb-1.5">Additional Stats:</p>
          <div className="pl-2 space-y-1">
            <StatRow label="Foraging Success" value={stats.deer.foragingSuccess} />
            <StatRow label="Migrated (Avg/Year)" value={stats.deer.migrated} />
            <StatRow label="Reproduced (Avg/Year)" value={stats.deer.reproduced} />
          </div>
        </div>
        
        <DeathCausesSection title="Death Causes" causes={stats.deer.deathCauses} />
      </StatsCard>
      
      {/* Wolf Statistics Card */}
      <StatsCard title="Wolves" color="gray">
        <StatRow label="Current Population" value={stats.wolves.current.toLocaleString()} highlight={true} />
        <StatRow label="Average Population" value={stats.wolves.average.toLocaleString()} />
        <StatRow label="Current Avg Age" value={stats.wolves.currentAvgAge} />
        <StatRow label="Total Deaths" value={stats.wolves.totalDeaths.toLocaleString()} />
        <StatRow label="Avg Deaths/Year" value={stats.wolves.avgDeaths.toLocaleString()} />
        
        {/* These would need data from your simulation */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="font-semibold mb-1.5">Additional Stats:</p>
          <div className="pl-2 space-y-1">
            <StatRow label="Hunting Success" value={stats.wolves.huntingSuccess} />
            <StatRow label="Migrated (Avg/Year)" value={stats.wolves.migrated} />
            <StatRow label="Reproduced (Avg/Year)" value={stats.wolves.reproduced} />
          </div>
        </div>
        
        <DeathCausesSection title="Death Causes" causes={stats.wolves.deathCauses} />
      </StatsCard>
    </div>
  );
};

export default EnhancedStatisticsCards;