import React from 'react';

const DateRangePicker: React.FC<{ start?: string; end?: string; onChange: (s?: string, e?: string) => void }> = ({ start, end, onChange }) => {
  return (
    <div className="flex gap-2 items-center">
      <input type="date" value={start || ''} onChange={(e) => onChange(e.target.value, end)} className="p-2 border rounded" />
      <span className="text-sm">to</span>
      <input type="date" value={end || ''} onChange={(e) => onChange(start, e.target.value)} className="p-2 border rounded" />
    </div>
  );
};

export default DateRangePicker;
