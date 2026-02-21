# Quick Start Guide

## 1-Minute Setup (with running MongoDB)

### Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

That's it! Your app is running at `http://localhost:5173`.

---

## First Run

1. Open `http://localhost:5173` in your browser
2. You'll land on the login page
3. Click "Register" or use demo credentials if you seeded:
   - Username: `demo`
   - Password: `password`

---

## Seed Example Data

Optional: populate the database with sample trackers.

```bash
cd backend
npm run seed
# Creates user 'demo' and sample data across all modules
```

---

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod` (local) or update `MONGO_URI` in `.env`

### "Port 4000 already in use"
- Change `PORT` in `backend/.env` to 4001 (or kill the process using 4000)

### "Vite dev server won't start"
- Try clearing `frontend/node_modules` and reinstalling

### Frontend shows blank page
- Check browser console (F12) for errors
- Verify `VITE_API_URL` matches your backend URL

---

## Project Structure (Quick Reference)

```
tracker/
├── backend/
│   ├── src/
│   │   ├── models/     ← MongoDB schemas
│   │   ├── routes/     ← API endpoints
│   │   └── seed.ts     ← Generate demo data
│   └── .env.example    ← Copy to .env
├── frontend/
│   ├── src/
│   │   ├── pages/      ← Full-page views
│   │   ├── components/ ← Reusable UI
│   │   └── stores/     ← Zustand state
│   └── vite.config.ts
└── README.md           ← Full reference
```

---

## Next Steps

1. **Customize**: Edit fields in models and pages
2. **Add module**: Follow [DEVELOPMENT.md](./DEVELOPMENT.md)
3. **Deploy**: Build both apps and host (Vercel, Render, etc.)
4. **Extend**: Add features like notifications, analytics, collaboration
