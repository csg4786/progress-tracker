import React from 'react';

const Toast: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow">{message}</div>
  );
};

export default Toast;
