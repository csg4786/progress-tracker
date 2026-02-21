# Architecture & Database Schema

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Frontend                       │
│         (React 18 + Vite + TypeScript + TailwindCSS)            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pages (Dashboard, DailyTracker, DsaTracker, etc.)       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Components (Table, Modal, Toast, TagSelector, etc.)     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Stores (Zustand: authStore, dailyStore, etc.)           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Services (axios with JWT interceptor)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│                      HTTP/REST (JSON)                            │
│                   + JWT Bearer Token                             │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │   CORS Enabled           │
                    │   http://localhost:4000  │
                    └────────────┬─────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Backend / API Server                        │
│        (Node.js + Express + TypeScript + MongoDB)               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Routes                                          │  │
│  │  /api/auth         → auth.routes.ts                      │  │
│  │  /api/daily        → daily.routes.ts                     │  │
│  │  /api/dsa          → generic.routes.ts                   │  │
│  │  /api/backup       → backup.routes.ts                    │  │
│  │  ... (weekly, monthly, system-design, backend-topic)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware                                              │  │
│  │  • cors()          — Enable CORS                         │  │
│  │  • express.json()  — Parse JSON                          │  │
│  │  • authenticate()  — Verify JWT token                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers                                             │  │
│  │  • auth.controller.ts      — register(), login()         │  │
│  │  • daily.controller.ts     — CRUD for Daily              │  │
│  │  • generic.controller.ts   — Reusable CRUD              │  │
│  │  • backup.controller.ts    — export(), import()          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Models (Mongoose Schemas)                               │  │
│  │  • User          — Authentication                        │  │
│  │  • Daily         — Daily tracker                         │  │
│  │  • Weekly        — Weekly tracker                        │  │
│  │  • Monthly       — Monthly tracker                       │  │
│  │  • DSA           — DSA problems                          │  │
│  │  • BackendTopic  — Backend learning                      │  │
│  │  • SystemDesign  — System design                         │  │
│  │  • Task          — Kanban tasks                          │  │
│  │  • Job           — Job applications                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│                    MongoDB Protocol (TCP)                        │
│                    mongodb://localhost:27017                     │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │         MongoDB          │
                    │     (Persistent Data)    │
                    │                          │
                    │  Database:               │
                    │  career_command_center   │
                    └──────────────────────────┘
                    
                    Collections:
                    • users
                    • dailies
                    • weeklies
                    • monthlies
                    • dsas
                    • backendtopics
                    • systemdesigns
                    • tasks
                    • jobs
```

---

## Request/Response Flow Example

```
Frontend (React)
      ↓
1. User clicks "Create Daily Entry"
   Modal form opens with fields:
   - date, dsaCompleted, backendLearning, 
     systemDesign, projectWork, notes, timeSpentHours, energyLevel
      ↓
2. Form submits via axios POST
   POST /api/daily
   Headers: { Authorization: "Bearer <JWT_TOKEN>", Content-Type: "application/json" }
   Body: { date: "2026-02-20", dsaCompleted: 2, ... }
      ↓
Express Middleware
      ↓
3. authenticate() verifies JWT signature & expiry
   If valid, sets req.userId from token payload
   If invalid, returns 401 Unauthorized
      ↓
Express Route Handler
      ↓
4. Matches POST /api/daily → daily.controller.ts
   Calls createDaily(req, res)
      ↓
Controller
      ↓
5. Validates input (basic checks)
   new Daily(req.body)
   Runs pre-save hook to auto-calculate score
   Saves to MongoDB
      ↓
Database
      ↓
6. MongoDB creates document with:
   { _id: ObjectId, date, dsaCompleted, ..., score: 2 }
   Returns inserted document
      ↓
Response Back
      ↓
7. Express sends 201 Created with document:
   { "_id": "...", "date": "...", "score": 2, ... }
      ↓
Frontend
      ↓
8. Axios resolves promise
   Component updates Zustand store
   UI re-renders with new entry
   Toast notification: "Entry created successfully"
```

---

## Database Schema (MongoDB Collections)

### User
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (bcrypt hash),
  createdAt: Date
}
```

### Daily
```javascript
{
  _id: ObjectId,
  date: Date (unique),
  dsaCompleted: Number,
  backendLearning: Number,
  systemDesign: Number,
  projectWork: Number,
  notes: String (optional),
  timeSpentHours: Number,
  energyLevel: Number (0-5),
  score: Number (0-5, auto-calculated)
}
```

### Weekly
```javascript
{
  _id: ObjectId,
  weekStart: Date,
  weekEnd: Date,
  dsaTotal: Number,
  backendTopicsCompleted: Number,
  systemDesignTopics: Number,
  projectCommits: Number,
  wins: [String],
  failures: [String],
  fixes: [String],
  weeklyScore: Number (auto-calculated),
  status: String (default: "on-track")
}
```

### Monthly
```javascript
{
  _id: ObjectId,
  month: String (YYYY-MM, unique),
  dsaTotal: Number,
  backendTopics: Number,
  systemDesignTopics: Number,
  projectProgressPercent: Number,
  resumeUpdates: [String],
  confidenceLevel: Number (0-10),
  switchStage: String (optional)
}
```

### DSA
```javascript
{
  _id: ObjectId,
  name: String,
  link: String (optional),
  difficulty: String ("Easy" | "Medium" | "Hard"),
  pattern: String (optional),
  topic: String (optional),
  status: String (default: "todo"),
  notes: String (optional),
  tags: [String]
}
```

### BackendTopic
```javascript
{
  _id: ObjectId,
  topic: String,
  category: String (optional),
  status: String (default: "todo"),
  notes: String (optional),
  githubLink: String (optional)
}
```

### SystemDesign
```javascript
{
  _id: ObjectId,
  concept: String,
  category: String (optional),
  status: String (default: "todo"),
  diagramLink: String (optional),
  notes: String (optional)
}
```

### Task (Kanban)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String (optional),
  column: String ("Backlog" | "In Progress" | "Testing" | "Completed" | "Documented"),
  priority: String ("Low" | "Medium" | "High"),
  area: String (optional),
  notes: String (optional),
  order: Number
}
```

### Job
```javascript
{
  _id: ObjectId,
  company: String,
  role: String (optional),
  location: String (optional),
  referral: String (optional),
  stage: String (default: "applied"),
  notes: String (optional),
  appliedAt: Date
}
```

---

## Authentication Flow

```
1. User Registration
   Frontend: POST /api/auth/register { username, password }
   Backend:
     • Check username not taken
     • Bcrypt hash password (10 salt rounds)
     • Create User document
     • Generate JWT (payload: { id: user._id })
     • Return token + user
   Frontend: Store token in localStorage

2. User Login
   Frontend: POST /api/auth/login { username, password }
   Backend:
     • Find user by username
     • Bcrypt compare password
     • Generate JWT
     • Return token + user
   Frontend: Store token in localStorage

3. Protected Request
   Frontend: Include "Authorization: Bearer <token>" header
   Backend:
     • Extract token from header
     • Verify JWT signature (using JWT_SECRET)
     • Check expiry time
     • If valid, set req.userId and proceed
     • If invalid, return 401

4. Logout
   Frontend: Remove token from localStorage
   (No backend logout needed for stateless JWT)
```

---

## Deployment Topology (Example)

```
┌─────────────────────────────────┐
│     Internet / Users            │
└────────────┬────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │   Vercel/Netlify   │
    │    (Frontend)      │
    │ React SPA on CDN   │
    │  https://app.com   │
    └────────┬───────────┘
             │ (API calls)
             ↓
   ┌──────────────────────────────┐
   │   Render/Heroku/Railway       │
   │    (Backend API Server)       │
   │   Node.js + Express           │
   │   https://api.app.com         │
   └────────┬─────────────────────┘
            │
            ↓
  ┌──────────────────────────┐
  │   MongoDB Atlas Cloud    │
  │    (Managed Database)    │
  │                          │
  │  career_command_center   │
  │  (9 collections)         │
  └──────────────────────────┘
```

---

## Data Flow Diagram (Create Entry Example)

```
Zustand Store
(authStore, dailyStore)
     ↑
     │ (useState → setItems)
     │
React Form Component
     ↓
     │ (onSubmit)
     ↓
usePost Hook
     │ (axios.post)
     ↓
Axios Instance
     │ (adds Authorization header)
     │ (structured as JSON)
     ↓
Express Route
     │ (/api/daily)
     ↓
Auth Middleware
     │ (verify JWT)
     ↓
Controller
     │ (createDaily)
     ↓
Mongoose Model
     │ (pre-save hook)
     │ (validate & create)
     ↓
MongoDB
     │ (insert)
     ↓
Response
     │ (201 + document)
     ↓
usePost Hook
     │ (async resolved)
     ↓
React Component
     │ (update store)
     ↓
UI Re-renders
     │ (new entry visible)
     ↓
Toast Notification
     (Success message)
```

This architecture ensures:
✅ **Separation of Concerns** — Frontend, API, Database separate layers
✅ **Scalability** — Each layer can scale independently
✅ **Security** — JWT auth, password hashing, HTTPS in production
✅ **Maintainability** — Clear data flow and module structure
