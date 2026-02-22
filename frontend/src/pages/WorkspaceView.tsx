import React, { useEffect, useState } from 'react';
import { Outlet, Link, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import Dashboard from './Dashboard';
import DailyTracker from './DailyTracker';
import ProjectBoard from './ProjectBoard';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';

const WorkspaceView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`/workspaces/${id}`);
        setWorkspace(res.data);
        // get members to infer role
        const membersRes = await axios.get(`/workspaces/${id}/members`);
        const owner = membersRes.data.owner;
        const members = membersRes.data.members || [];
        const me = members.find((m: any) => m.user && m.user._id === (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : null));
        if (owner && owner._id === (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : null)) setRole('owner');
        else if (me) setRole(me.role);
        else setRole('viewer');
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [id]);

  if (!id) return <div className="p-6">No workspace selected</div>;

  return (
    <WorkspaceProvider initialId={id} initialRole={role}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{workspace?.name || 'Workspace'}</h2>
            <div className="text-sm text-gray-500">Role: {role || 'loading'}</div>
          </div>
          <div className="flex gap-2">
            <Link to="dashboard" className="px-3 py-1 bg-indigo-600 text-white rounded">Dashboard</Link>
            <Link to="daily" className="px-3 py-1 bg-indigo-600 text-white rounded">Daily</Link>
            <Link to="board" className="px-3 py-1 bg-indigo-600 text-white rounded">Board</Link>
            <button onClick={() => navigate('/workspaces')} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Back</button>
          </div>
        </div>

        <div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="daily" element={<DailyTracker />} />
            <Route path="board" element={<ProjectBoard />} />
          </Routes>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default WorkspaceView;
