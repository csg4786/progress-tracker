import React from 'react';

type Column<T> = { key: keyof T; label: string; render?: (row: T) => React.ReactNode };

const Table = <T,>({ columns, data }: { columns: Column<T>[]; data: T[] }) => {
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="text-left">
            {columns.map((c) => (
              <th key={String(c.key)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t dark:border-gray-700">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-4 py-3 text-sm align-top">
                  {c.render ? c.render(row) : (row as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
