import React from 'react';
import { useLocation } from 'react-router-dom';
import { useModalStore } from '../stores/modalStore';

const FloatingAdd: React.FC = () => {
  const location = useLocation();
  const { openModal } = useModalStore();

  const handleClick = () => {
    const path = location.pathname;
    if (path.includes('/weekly')) {
      openModal('create-weekly');
    } else if (path.includes('/monthly')) {
      openModal('create-monthly');
    } else if (path.includes('/dsa')) {
      openModal('create-dsa');
    } else if (path.includes('/backend')) {
      openModal('create-backend');
    } else if (path.includes('/system-design')) {
      openModal('create-system-design');
    } else if (path.includes('/board')) {
      openModal('create-task');
    } else if (path.includes('/jobs')) {
      openModal('create-job');
    }
  };

  const isVisible = ['/weekly', '/monthly', '/dsa', '/backend', '/system-design', '/board', '/jobs'].some(
    (path) => location.pathname.includes(path)
  );

  if (!isVisible) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
    >
      +
    </button>
  );
};

export default FloatingAdd;
