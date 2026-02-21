import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const items = [
    ['Dashboard', '/dashboard'],
    ['Daily', '/daily'],
    ['DSA', '/dsa'],
    ['Project Board', '/board']
  ];
  return (
    <aside className="w-60 border-r dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hidden md:block">
      <nav className="space-y-2">
        {items.map(([label, to]) => (
          <NavLink key={to} to={to} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
