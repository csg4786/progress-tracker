import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import apiRouter from './routes';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'Career Command Center API' });
});

async function start() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/career_command_center';
  await connectDB(uri);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
