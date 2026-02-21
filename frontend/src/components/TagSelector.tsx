import React from 'react';

const TagSelector: React.FC<{ tags: string[]; onChange: (tags: string[]) => void }> = ({ tags, onChange }) => {
  const [value, setValue] = React.useState('');

  const add = () => {
    if (!value) return;
    onChange([...tags, value]);
    setValue('');
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {tags.map((t) => (
          <div key={t} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-2">
            <span className="text-sm">{t}</span>
            <button onClick={() => remove(t)} className="text-xs">x</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 p-2 border rounded" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add tag" />
        <button onClick={add} className="px-3 bg-indigo-600 text-white rounded">Add</button>
      </div>
    </div>
  );
};

export default TagSelector;
