traCko
=====

Minimal project overview
------------------------

traCko is a personal productivity and project-tracking application (MERN stack). It provides a Daily tracker, a kanban-style Project board, and a stat Dashboard. This repository is under active development and supports both single-user and workspace-scoped usage.

Quick start (developer)
-----------------------

1. Clone the repo:

```bash
git clone <repo-url> traCko
cd traCko
```

2. Backend (API)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET
npm run dev    # starts the backend in dev mode
```

3. Frontend (web UI)

```bash
cd frontend
npm install
# set VITE_API_URL in .env if needed (default: http://localhost:4000/api)
npm run dev    # starts Vite dev server (default port 5173)
```

Open the frontend in your browser (usually http://localhost:5173).

Building for production
-----------------------

Build backend and frontend separately:

```bash
cd backend
npm run build
cd ../frontend
npm run build
```

Notes and status
----------------
- Tech: React + Vite (frontend), Node + Express + TypeScript + Mongoose (backend).
- The project is actively being migrated to workspace-scoped features (multi-user workspaces, ACLs, workspace-scoped TaskTypes/Sections). Some parts may be in-progress and TypeScript typings may be relaxed temporarily.
- If you encounter build/type errors, run the backend build from the `backend` folder and share the `tsc` output.

Contributing
------------
Open issues or PRs for bugs and small improvements. For major changes, please open an issue first to discuss the design.

License
-------
See repository license (if any).
