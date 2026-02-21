// small CSV utilities for export
export const toCSV = (items: any[], fields?: string[]) => {
  if (!items || items.length === 0) return '';
  const keys = fields || Object.keys(items[0]);
  const rows = [keys.join(',')];
  for (const it of items) {
    const vals = keys.map((k) => {
      const v = it[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
      return '"' + String(v).replace(/"/g, '""') + '"';
    });
    rows.push(vals.join(','));
  }
  return rows.join('\n');
};

export const downloadCSV = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
