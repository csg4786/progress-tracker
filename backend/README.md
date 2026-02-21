# Career Command Center — Backend

Quick start

1. copy `.env.example` to `.env` and set values
2. Install dependencies: `npm install`
3. Run dev: `npm run dev`
4. Seed example data: `npm run seed`

API endpoints:
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login
- `GET /api/daily` — list (auth)
- `POST /api/daily` — create (auth)
- Generic endpoints under `/api/weekly`, `/api/monthly`, `/api/dsa`, `/api/backend-topic`, `/api/system-design`, `/api/tasks`, `/api/jobs` — all require auth
