import React from 'react';

const Modal: React.FC<{ open: boolean; onClose: () => void; title?: string; children?: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-4 rounded max-w-lg w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2">Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
