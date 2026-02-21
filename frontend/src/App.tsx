import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DailyTracker from './pages/DailyTracker';
import DsaTracker from './pages/DsaTracker';
import ProjectBoard from './pages/ProjectBoard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FloatingAdd from './components/FloatingAdd';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {!isAuthPage && <Navbar />}
      <div className="flex">
        {!isAuthPage && <Sidebar />}
        <main className={isAuthPage ? 'w-full' : 'flex-1'}>
          <div className={isAuthPage ? '' : 'p-4'}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/daily"
                element={
                  <ProtectedRoute>
                    <DailyTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dsa"
                element={
                  <ProtectedRoute>
                    <DsaTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board"
                element={
                  <ProtectedRoute>
                    <ProjectBoard />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
      {!isAuthPage && <FloatingAdd />}
    </div>
  );
};

export default App;
