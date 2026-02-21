import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/user.model';
import Daily from './models/daily.model';
import Weekly from './models/weekly.model';
import Monthly from './models/monthly.model';
import BackendTopic from './models/backendTopic.model';
import SystemDesign from './models/systemDesign.model';
import Task from './models/task.model';
import Job from './models/job.model';
import { connect } from 'http2';
import { connectDB } from './config/db';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/career_command_center';

async function seed() {
  await connectDB(uri);

  // clear
  await Promise.all([
    User.deleteMany({}),
    Daily.deleteMany({}),
    Weekly.deleteMany({}),
    Monthly.deleteMany({}),
    BackendTopic.deleteMany({}),
    SystemDesign.deleteMany({}),
    Task.deleteMany({}),
    Job.deleteMany({})
  ]);

  const hash = await bcrypt.hash('password', 10);
  await User.create({ username: 'demo', password: hash });

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    await Daily.create({
      date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000),
      backendLearning: Math.floor(Math.random() * 3),
      systemDesign: Math.floor(Math.random() * 2),
      projectWork: Math.floor(Math.random() * 4),
      notes: 'Seeded daily',
      timeSpentHours: Math.floor(Math.random() * 6),
      energyLevel: Math.floor(Math.random() * 6)
    });
  }

  await Weekly.create({
    weekStart: new Date(),
    weekEnd: new Date(),
    backendTopicsCompleted: 3,
    systemDesignTopics: 1,
    projectCommits: 5,
    wins: ['Completed feature X'],
    failures: ['Missed deadline'],
    fixes: ['Improved test coverage']
  });

  await Monthly.create({ month: '2026-02', backendTopics: 8, systemDesignTopics: 3, projectProgressPercent: 45 });
  await BackendTopic.create({ topic: 'REST APIs', category: 'APIs', status: 'in-progress' });
  await SystemDesign.create({ concept: 'Load Balancing', category: 'Scalability', status: 'todo' });

  await Task.create({ title: 'Set up CI', column: 'Backlog', priority: 'High', area: 'infra' });
  await Job.create({ company: 'Example Co', role: 'Software Engineer', stage: 'applied' });

  console.log('Seeding complete. Created demo user: demo / password');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
