# Development Guide

## Architecture Overview

This is a modular MERN app designed for extensibility. Each "tracker" module follows the same pattern:

### Backend Pattern (Mongoose → Express)

1. **Model** (`src/models/*.model.ts`)
   - Define MongoDB schema
   - Add pre-save hooks for computed fields
   - Export TypeScript interface

2. **Controller** (`src/controllers/*.controller.ts`)
   - Implement CRUD logic
   - Use generic helpers from `generic.controller.ts`

3. **Routes** (`src/routes/*.routes.ts`)
   - Mount middleware (auth)
   - Map HTTP verbs to controller actions
   - Add custom routes (e.g., `/search`, `/bulk-delete`)

### Frontend Pattern (Zustand → React)

1. **Store** (`src/stores/*.store.ts`)
   - Define Zustand store with state + actions
   - Fetch from API and sync

2. **Pages** (`src/pages/*.tsx`)
   - Use store to fetch and display data
   - Manage UI state (modals, filters)

3. **Components** (`src/components/*.tsx`)
   - Reusable form/table/card components
   - Accept data and callbacks as props

## Adding a New Tracker Module

### Example: "Habits Tracker"

#### Step 1: Create Backend Model

```typescript
// backend/src/models/habit.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IHabit extends Document {
  name: string;
  frequency: 'daily' | 'weekly';
  category?: string;
  completedDates?: Date[];
  streak?: number;
}

const HabitSchema = new Schema<IHabit>({
  name: { type: String, required: true },
  frequency: { type: String, default: 'daily' },
  category: String,
  completedDates: [Date],
  streak: { type: Number, default: 0 }
});

export default model<IHabit>('Habit', HabitSchema);
```

#### Step 2: Add Controller

```typescript
// backend/src/controllers/habit.controller.ts
import { createResource, listResource, getResource, updateResource, deleteResource } from './generic.controller';
import Habit from '../models/habit.model';

export const createHabit = createResource(Habit);
export const listHabits = listResource(Habit);
export const getHabit = getResource(Habit);
export const updateHabit = updateResource(Habit);
export const deleteHabit = deleteResource(Habit);
```

#### Step 3: Add Routes

```typescript
// backend/src/routes/habit.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/habit.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/', ctrl.createHabit);
router.get('/', ctrl.listHabits);
router.get('/:id', ctrl.getHabit);
router.put('/:id', ctrl.updateHabit);
router.delete('/:id', ctrl.deleteHabit);

export default router;
```

#### Step 4: Mount in API Index

```typescript
// backend/src/routes/index.ts (updated)
import habitRoutes from './habit.routes';

router.use('/habits', habitRoutes);
```

#### Step 5: Create Frontend Store

```typescript
// frontend/src/stores/habitStore.ts
import create from 'zustand';

type HabitState = {
  items: any[];
  setItems: (items: any[]) => void;
  addItem: (it: any) => void;
  removeItem: (id: string) => void;
};

export const useHabitStore = create<HabitState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (it) => set((s) => ({ items: [it, ...s.items] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((x) => x._id !== id) }))
}));
```

#### Step 6: Create Frontend Page

```typescript
// frontend/src/pages/HabitTracker.tsx
import React, { useEffect, useState } from 'react';
import axios from '../services/axios';
import { useHabitStore } from '../stores/habitStore';
import Table from '../components/Table';

const HabitTracker: React.FC = () => {
  const { items, setItems } = useHabitStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/habits');
      setItems(res.data.data || res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Habits Tracker</h2>
      {loading ? <p>Loading...</p> : <Table columns={[{ key: 'name', label: 'Name' }]} data={items} />}
    </div>
  );
};

export default HabitTracker;
```

#### Step 7: Add Route to App

```typescript
// frontend/src/App.tsx
import HabitTracker from './pages/HabitTracker';

<Route path="/habits" element={<HabitTracker />} />
```

## Form Patterns

### Backend Validation

```typescript
import { body, validationResult } from 'express-validator';

router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('frequency').isIn(['daily', 'weekly']).withMessage('Invalid frequency')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  // proceed
});
```

### Frontend Form Component

```typescript
const Form: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [data, setData] = React.useState({ name: '', frequency: 'daily' });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };
  return (
    <form onSubmit={submit}>
      <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
      <button>Submit</button>
    </form>
  );
};
```

## API Response Format

All endpoints follow this convention:

### List (with pagination)

```json
{
  "data": [{ "_id": "...", "name": "..." }],
  "total": 42
}
```

### Single Resource

```json
{
  "_id": "...",
  "name": "..."
}
```

### Error

```json
{
  "message": "Invalid input"
}
```

## Testing

### Backend (sample)

```bash
# Test an endpoint with curl
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password"}'

# Copy the token and use it:
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/daily
```

### Frontend

```bash
# Run Vite in dev mode to see HMR and errors
npm run dev

# Check browser console for API errors
# Use Redux DevTools or Zustand DevTools for store debugging
```

## Performance Tips

1. **Pagination**: Always use skip/limit in list endpoints
2. **Indexing**: Add MongoDB indexes for frequently queried fields:
   ```typescript
   schema.index({ date: -1 });
   ```
3. **Lazy Loading**: Load tracker pages on demand, not all at once
4. **Caching**: Use localStorage for user preferences, not large datasets
5. **API Batching**: Fetch multiple resources in parallel with Promise.all()

## Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS in production
- [ ] Configure CORS for your domain
- [ ] Set up MongoDB Atlas or managed DB
- [ ] Enable database backups
- [ ] Add error logging (Sentry, LogRocket)
- [ ] Test auth flows end-to-end
- [ ] Verify all integrations
- [ ] Set up CI/CD pipeline
