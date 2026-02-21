# Career Command Center — Frontend

Development

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`

Environment

Set `VITE_API_URL` to your backend API base (e.g. `http://localhost:4000/api`).

CSV / Export notes

- Use the Settings page to export/import a full workspace JSON backup.
- For CSV export, use the `toCSV` and `downloadCSV` utilities in `src/utils/csv.ts` to convert arrays to CSV and trigger a download. Example:

```ts
import { toCSV, downloadCSV } from './src/utils/csv';
const csv = toCSV(items);
downloadCSV('items.csv', csv);
```

