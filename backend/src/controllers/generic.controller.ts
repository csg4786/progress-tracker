import { Request, Response } from 'express';
import Weekly from '../models/weekly.model';
import Monthly from '../models/monthly.model';
import BackendTopic from '../models/backendTopic.model';
import SystemDesign from '../models/systemDesign.model';
import Task from '../models/task.model';
import Job from '../models/job.model';
import Section from '../models/section.model';

// For brevity, implement generic CRUD patterns here and reuse in routes

export const createResource = (Model: any) => async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };
    const userId = (req as any).userId;
    // Attach user if this is a user-scoped resource and no workspace provided
    if (userId && !body.user && !body.workspace) body.user = userId;
    const doc = new Model(body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const listResource = (Model: any) => async (req: Request, res: Response) => {
  const { page = 1, limit = 20, q } = req.query as any;
  const userId = (req as any).userId;
  const filter = q ? JSON.parse(q) : {};
  // If a workspaceId query param is provided, use workspace scoping instead of user
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  if (workspaceId) {
    filter.workspace = workspaceId;
  } else if (userId && filter.user === undefined) {
    filter.user = userId;
  }
  const docs = await Model.find(filter).skip((+page - 1) * +limit).limit(+limit).sort({ createdAt: -1 });
  const total = await Model.countDocuments(filter);
  res.json({ data: docs, total });
};

export const getResource = (Model: any) => async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  let doc;
  if (workspaceId) {
    doc = await Model.findOne({ _id: req.params.id, workspace: workspaceId });
  } else if (userId) {
    doc = await Model.findOne({ _id: req.params.id, user: userId });
  } else {
    doc = await Model.findById(req.params.id);
  }
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};

export const updateResource = (Model: any) => async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  let doc;
  if (workspaceId) {
    doc = await Model.findOneAndUpdate({ _id: req.params.id, workspace: workspaceId }, req.body, { new: true, runValidators: true });
  } else if (userId) {
    doc = await Model.findOneAndUpdate({ _id: req.params.id, user: userId }, req.body, { new: true, runValidators: true });
  } else {
    doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  }
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};

export const deleteResource = (Model: any) => async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  if (workspaceId) await Model.findOneAndDelete({ _id: req.params.id, workspace: workspaceId });
  else if (userId) await Model.findOneAndDelete({ _id: req.params.id, user: userId });
  else await Model.findByIdAndDelete(req.params.id);
  res.status(204).send();
};

export const models = {
  weekly: Weekly,
  monthly: Monthly,
  backendTopic: BackendTopic,
  systemDesign: SystemDesign,
  task: Task,
  section: Section,
  job: Job
};
