import React, { useEffect, useState, useContext } from 'react';
import WorkspaceContext from '../contexts/WorkspaceContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import axios from '../services/axios';

interface TaskType {
  _id: string;
  name: string;
  color: string;
}

interface DailyEntry {
  _id: string;
  date: string;
  tasks: any[];
  score: number;
}

interface TaskStats {
  [taskType: string]: {
    completed: number;
    total: number;
  };
}

interface StreakData {
  [taskType: string]: number;
}

const Dashboard: React.FC = () => {
  const { workspaceId } = useContext(WorkspaceContext);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({});
  const [weeklyStats, setWeeklyStats] = useState<TaskStats>({});
  const [monthlyStats, setMonthlyStats] = useState<TaskStats>({});
  const [allTimeStats, setAllTimeStats] = useState<TaskStats>({});
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [allTimeChartData, setAllTimeChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch task types and daily entries (workspace-scoped when active)
        const [typesRes, dailyRes] = await Promise.all([
          axios.get('/task-types', { params: workspaceId ? { workspaceId } : {} }),
          axios.get('/daily', { params: workspaceId ? { workspaceId } : {} })
        ]);

        const types = typesRes.data.data || [];
        const entries = (dailyRes.data.data || dailyRes.data || [])
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setTaskTypes(types);
        setDailyEntries(entries);

        // Calculate all stats
        calculateStreaks(entries, types);
        calculateWeeklyStats(entries, types);
        calculateMonthlyStats(entries, types);
        calculateAllTimeStats(entries, types);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStreaks = (entries: DailyEntry[], types: TaskType[]) => {
    const streaks: StreakData = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    types.forEach((type) => {
      let streak = 0;
      let currentDate = new Date(today);

      for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayEntry = entries.find(
          (e) => new Date(e.date).toISOString().split('T')[0] === dateStr
        );

        if (!dayEntry) break;

        const hasCompletedTask = dayEntry.tasks.some(
          (t) => t.type === type.name && t.completed
        );

        if (hasCompletedTask) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      streaks[type.name] = streak;
    });

    setStreakData(streaks);
  };

  const calculateWeeklyStats = (entries: DailyEntry[], types: TaskType[]) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= weekStart && d < weekEnd;
    });

    const stats: TaskStats = {};
    types.forEach((type) => {
      let completed = 0;
      let total = 0;
      weekEntries.forEach((entry) => {
        entry.tasks.forEach((task) => {
          if (task.type === type.name) {
            total++;
            if (task.completed) completed++;
          }
        });
      });
      stats[type.name] = { completed, total };
    });

    // Add total
    stats['Total'] = {
      completed: Object.values(stats).reduce((sum, s) => sum + s.completed, 0),
      total: Object.values(stats).reduce((sum, s) => sum + s.total, 0),
    };

    setWeeklyStats(stats);

    // Chart data for weekly - calculate daily completion percentage
    const chartData = weekEntries.map((e) => {
      const totalTasks = e.tasks.length;
      const completedTasks = e.tasks.filter((t) => t.completed).length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage,
      };
    });
    setWeeklyChartData(chartData);
  };

  const calculateMonthlyStats = (entries: DailyEntry[], types: TaskType[]) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= monthStart && d < monthEnd;
    });

    const stats: TaskStats = {};
    types.forEach((type) => {
      let completed = 0;
      let total = 0;
      monthEntries.forEach((entry) => {
        entry.tasks.forEach((task) => {
          if (task.type === type.name) {
            total++;
            if (task.completed) completed++;
          }
        });
      });
      stats[type.name] = { completed, total };
    });

    stats['Total'] = {
      completed: Object.values(stats).reduce((sum, s) => sum + s.completed, 0),
      total: Object.values(stats).reduce((sum, s) => sum + s.total, 0),
    };

    setMonthlyStats(stats);

    // Chart data for monthly - calculate daily completion percentage
    const chartData = monthEntries.map((e) => {
      const totalTasks = e.tasks.length;
      const completedTasks = e.tasks.filter((t) => t.completed).length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage,
      };
    });
    setMonthlyChartData(chartData);
  };

  const calculateAllTimeStats = (entries: DailyEntry[], types: TaskType[]) => {
    const stats: TaskStats = {};
    types.forEach((type) => {
      let completed = 0;
      let total = 0;
      entries.forEach((entry) => {
        entry.tasks.forEach((task) => {
          if (task.type === type.name) {
            total++;
            if (task.completed) completed++;
          }
        });
      });
      stats[type.name] = { completed, total };
    });

    stats['Total'] = {
      completed: Object.values(stats).reduce((sum, s) => sum + s.completed, 0),
      total: Object.values(stats).reduce((sum, s) => sum + s.total, 0),
    };

    setAllTimeStats(stats);

    // Chart data for all-time - calculate daily completion percentage
    const chartData = entries.map((e) => {
      const totalTasks = e.tasks.length;
      const completedTasks = e.tasks.filter((t) => t.completed).length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage,
      };
    });
    setAllTimeChartData(chartData);
  };

  const getTaskTypeColor = (typeName: string) => {
    if (typeName === 'Total') return '#6366F1'; // indigo as default
    const type = taskTypes.find((t) => t.name === typeName);
    return type?.color || '#6366F1';
  };

  const renderStatsSection = (stats: TaskStats, title: string) => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(stats).map(([typeName, data]) => {
          const isTotal = typeName === 'Total';
          const totalColor = '#b86363';
          const color = isTotal ? totalColor : getTaskTypeColor(typeName);
          const backgroundColor = isTotal ? totalColor + '15' : color + '15';
          const borderColor = isTotal ? totalColor : color;
          const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
          
          return (
            <div 
              key={typeName} 
              className="p-3 rounded"
              style={{ 
                backgroundColor: backgroundColor,
                borderLeft: `4px solid ${borderColor}`
              }}
            >
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{typeName}</div>
              <div className="text-xl font-bold mt-1" style={{ color }}>{data.completed}/{data.total}</div>
              <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderChartSection = (title: string, chartData: any[]) => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Line type="monotone" dataKey="percentage" stroke="#6366F1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">No data available</div>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Streak Section */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-4">🔥 Current Streaks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {taskTypes.length > 0 ? (
            taskTypes.map((type) => (
              <div key={type._id} className="p-4 rounded text-center" style={{ backgroundColor: type.color + '15' }}>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{type.name}</div>
                <div className="text-3xl font-bold mt-2" style={{ color: type.color }}>
                  {streakData[type.name] || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">days</div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No task types available</div>
          )}
        </div>
      </div>

      {/* Weekly Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {renderStatsSection(weeklyStats, 'Weekly Stats')}
        {renderChartSection('Weekly Score Trend', weeklyChartData)}
      </div>

      {/* Monthly Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {renderStatsSection(monthlyStats, 'Monthly Stats')}
        {renderChartSection('Monthly Score Trend', monthlyChartData)}
      </div>

      {/* All-Time Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderStatsSection(allTimeStats, 'All-Time Stats')}
        {renderChartSection('All-Time Score Trend', allTimeChartData)}
      </div>
    </div>
  );
};

export default Dashboard;
