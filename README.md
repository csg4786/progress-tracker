# traCko

A complete MERN stack productivity & career-tracking system with modules for DSA, backend learning, system design, project management, and job applications.

## Tech Stack

- **Frontend**: React 18 + Vite, TypeScript, TailwindCSS, Zustand, Recharts
- **Backend**: Node.js + Express, TypeScript, MongoDB + Mongoose
- **Auth**: JWT-based with bcrypt password hashing
- **Storage**: LocalStorage (client-side cache), MongoDB (persistent)

## Project Structure

```
tracker/
├── backend/              # Express server
│   ├── src/
│   │   ├── models/       # Mongoose schemas
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middlewares/  # Auth, error handling
│   │   ├── config/       # DB config
│   │   ├── utils/        # Utilities
│   │   ├── index.ts      # Entry point
│   │   └── seed.ts       # Seed script
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── pages/        # Page components (Dashboard, Trackers, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── stores/       # Zustand stores
│   │   ├── services/     # API client (axios)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utilities (CSV, etc.)
│   │   └── App.tsx       # Main app
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
└── README.md
```

## Setup & Run

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env:
# PORT=4000
# MONGO_URI=mongodb://localhost:27017/career_command_center
# JWT_SECRET=your_secret_key_here
# JWT_EXPIRES_IN=7d
```

Make sure MongoDB is running locally (or update `MONGO_URI` in `.env`):

```bash
# If using mongod locally:
mongod --data /path/to/db
```

Start the backend:

```bash
npm run dev
```

Seed example data (optional):

```bash
npm run seed
# Creates demo user: demo / password
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file (or use defaults):

```bash
VITE_API_URL=http://localhost:4000/api
```

Start dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login (returns JWT token)

### Daily Tracker

- `GET /api/daily?page=1&limit=20&startDate=2026-02-01&endDate=2026-02-28` — List with filters
- `POST /api/daily` — Create
- `GET /api/daily/:id` — Get one
- `PUT /api/daily/:id` — Update
- `DELETE /api/daily/:id` — Delete

### Other Trackers

All follow the same CRUD pattern under:
- `/api/weekly` — Weekly tracker
- `/api/monthly` — Monthly tracker
- `/api/dsa` — DSA problems
- `/api/backend-topic` — Backend learning
- `/api/system-design` — System design
- `/api/tasks` — Kanban board tasks
- `/api/jobs` — Job applications

### Backup & Export

- `GET /api/backup/export` — Export all data as JSON
- `POST /api/backup/import` — Import from JSON

## Features

### Core Modules

1. **Daily Tracker** — Track daily progress with auto-calculated score
2. **Weekly Tracker** — Weekly summaries with weighted scoring
3. **Monthly Tracker** — Monthly reviews and progress tracking
4. **DSA Tracker** — Problem tracking with tags and difficulty
5. **Backend Learning** — Topic-based learning progress
6. **System Design** — Concept tracking with diagrams
7. **Project Board** — Kanban board with drag-and-drop
8. **Job Tracker** — Application tracking by stage

### UI Features

- Clean, responsive Tailwind design
- Dark/light mode support
- Reusable components: Table, Modal, Toast, DateRangePicker, TagSelector
- Charts via Recharts
- Pagination and filtering
- Drag-and-drop Kanban board
- CSV export utilities
- JSON backup/restore

### Authentication

- Local username/password auth
- JWT tokens stored in localStorage
- Protected API routes via middleware
- Auto token injection in axios

## Building for Production

### Backend

```bash
cd backend
npm run build
# then run with:
npm start
```

### Frontend

```bash
cd frontend
npm run build
# outputs to dist/
npm run preview
```

## Development Notes

- All models use MongoDB ObjectIds
- JWT tokens expire after 7 days (configurable in `.env`)
- Passwords are hashed with bcrypt (salt rounds: 10)
- Admin tools (seed, import/export) require auth tokens
- Drag-and-drop uses HTML5 native events
- Pagination uses skip/limit query params

## Next Steps / Enhancements

- Add filtering and search across all pages
- Implement advanced analytics dashboard
- Add email notifications
- Implement recurring tasks
- Add collaborative features
- Deploy to production (Vercel, Render, AWS, etc.)
- Add unit and integration tests
- Implement rate limiting
- Add role-based access control (RBAC)

## Default Credentials

After seeding:
- Username: `demo`
- Password: `password`
