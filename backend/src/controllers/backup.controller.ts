import { Request, Response } from 'express';
import Daily from '../models/daily.model';
import Weekly from '../models/weekly.model';
import Monthly from '../models/monthly.model';
import DSA from '../models/dsa.model';
import BackendTopic from '../models/backendTopic.model';
import SystemDesign from '../models/systemDesign.model';
import Task from '../models/task.model';
import Job from '../models/job.model';

export const exportAll = async (_req: Request, res: Response) => {
  const [dailies, weeklies, monthlies, dsas, backendTopics, systemDesigns, tasks, jobs] = await Promise.all([
    Daily.find(),
    Weekly.find(),
    Monthly.find(),
    DSA.find(),
    BackendTopic.find(),
    SystemDesign.find(),
    Task.find(),
    Job.find()
  ]);

  res.json({ dailies, weeklies, monthlies, dsas, backendTopics, systemDesigns, tasks, jobs });
};

// simple import: expects object with arrays for each collection
export const importAll = async (req: Request, res: Response) => {
  const payload = req.body || {};
  // For safety, do not drop collections automatically in production
  if (payload.dontClear !== true) {
    await Promise.all([
      Daily.deleteMany({}),
      Weekly.deleteMany({}),
      Monthly.deleteMany({}),
      DSA.deleteMany({}),
      BackendTopic.deleteMany({}),
      SystemDesign.deleteMany({}),
      Task.deleteMany({}),
      Job.deleteMany({})
    ]);
  }

  await Promise.all([
    ...(payload.dailies || []).map((d: any) => Daily.create(d)),
    ...(payload.weeklies || []).map((d: any) => Weekly.create(d)),
    ...(payload.monthlies || []).map((d: any) => Monthly.create(d)),
    ...(payload.dsas || []).map((d: any) => DSA.create(d)),
    ...(payload.backendTopics || []).map((d: any) => BackendTopic.create(d)),
    ...(payload.systemDesigns || []).map((d: any) => SystemDesign.create(d)),
    ...(payload.tasks || []).map((d: any) => Task.create(d)),
    ...(payload.jobs || []).map((d: any) => Job.create(d))
  ]);

  res.json({ ok: true });
};
