import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from '../services/axios';

interface DailySummary {
  date: string;
  score: number;
  backendLearning: number;
  systemDesign: number;
  projectWork: number;
}

interface Stats {
  totalDailyEntries: number;
  totalTasks: number;
  totalJobs: number;
  avgScore: number;
}

const Dashboard: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDailyEntries: 0,
    totalTasks: 0,
    totalJobs: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dailyRes = await axios.get('/daily');
        const taskRes = await axios.get('/tasks');
        const jobRes = await axios.get('/jobs');

        const dailyItems = dailyRes.data.data || dailyRes.data;
        
        // Prepare data for chart (last 7 days)
        const chartData = dailyItems
          .map((d: any) => ({
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: d.score,
            backendLearning: d.backendLearning,
            systemDesign: d.systemDesign,
            projectWork: d.projectWork,
          }))
          .slice(-7);

        const avgScore = dailyItems.length > 0
          ? (dailyItems.reduce((sum: number, d: any) => sum + d.score, 0) / dailyItems.length).toFixed(1)
          : 0;

        setDailyData(chartData);
        setStats({
          totalDailyEntries: dailyItems.length,
          totalTasks: Array.isArray(taskRes.data.data) ? taskRes.data.data.length : (taskRes.data.data ? 1 : 0),
          totalJobs: Array.isArray(jobRes.data.data) ? jobRes.data.data.length : (jobRes.data.data ? 1 : 0),
          avgScore: Number(avgScore),
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="text-gray-600 dark:text-gray-400 text-sm">Daily Entries</div>
          <div className="text-3xl font-bold text-indigo-600">{stats.totalDailyEntries}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="text-gray-600 dark:text-gray-400 text-sm">Tasks</div>
          <div className="text-3xl font-bold text-indigo-600">{stats.totalTasks}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="text-gray-600 dark:text-gray-400 text-sm">Job Prospects</div>
          <div className="text-3xl font-bold text-indigo-600">{stats.totalJobs}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="text-gray-600 dark:text-gray-400 text-sm">Avg Score</div>
          <div className="text-3xl font-bold text-green-600">{stats.avgScore}/5</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Daily Scores */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="font-semibold mb-4">Weekly Trend</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8884d8" stroke-width={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Bar Chart - Daily Activities */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="font-semibold mb-4">Activity Distribution</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="backendLearning" fill="#82ca9d" name="Backend" />
                <Bar dataKey="systemDesign" fill="#ffc658" name="System Design" />
                <Bar dataKey="projectWork" fill="#ff7c7c" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
