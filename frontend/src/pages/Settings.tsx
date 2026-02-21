import React, { useRef } from 'react';
import axios from '../services/axios';

const Settings: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const exportData = async () => {
    const res = await axios.get('/backup/export');
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ccc-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text);
    await axios.post('/backup/import', payload);
    alert('Import complete');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <button onClick={exportData} className="px-4 py-2 bg-indigo-600 text-white rounded">Export workspace</button>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="application/json" onChange={(e) => e.target.files && importData(e.target.files[0])} />
        </div>
      </div>
    </div>
  );
};

export default Settings;
