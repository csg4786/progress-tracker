import { Request, Response } from 'express';
import TaskType from '../models/taskType.model';

export const createTaskType = async (req: Request, res: Response) => {
  const { name, color, customFields } = req.body;
  try {
    const userId = (req as any).userId;
    const workspaceId = req.body.workspace || req.query.workspaceId;
    // Check if type already exists for this user or workspace
    const query: any = { name };
    if (workspaceId) query.workspace = workspaceId;
    else query.user = userId;
    const existing = await TaskType.findOne(query);
    if (existing) return res.status(409).json({ message: 'Task type already exists' });

    const type = new TaskType({ user: workspaceId ? undefined : userId, workspace: workspaceId, name, color, customFields });
    await type.save();
    res.status(201).json(type);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTaskTypes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const workspaceId = req.query.workspaceId as string | undefined;
    const filter: any = {};
    if (workspaceId) filter.workspace = workspaceId;
    else filter.user = userId;
    const types = await TaskType.find(filter).sort({ createdAt: -1 });
    res.json({ data: types });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTaskType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const workspaceId = req.query.workspaceId as string | undefined;
    const query: any = { _id: req.params.id };
    if (workspaceId) query.workspace = workspaceId;
    else query.user = userId;
    const type = await TaskType.findOne(query);
    if (!type) return res.status(404).json({ message: 'Task type not found' });
    res.json(type);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTaskType = async (req: Request, res: Response) => {
  const { name, color, customFields } = req.body;
  try {
    const userId = (req as any).userId;
    const workspaceId = req.body.workspace || req.query.workspaceId;
    const query: any = { _id: req.params.id };
    if (workspaceId) query.workspace = workspaceId;
    else query.user = userId;
    const type = await TaskType.findOneAndUpdate(query, { name, color, customFields }, { new: true, runValidators: true });
    if (!type) return res.status(404).json({ message: 'Task type not found' });
    res.json(type);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTaskType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const workspaceId = req.query.workspaceId as string | undefined;
    const query: any = { _id: req.params.id };
    if (workspaceId) query.workspace = workspaceId;
    else query.user = userId;
    await TaskType.findOneAndDelete(query);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const addCustomField = async (req: Request, res: Response) => {
  const { name, type, label } = req.body;
  try {
    const userId = (req as any).userId;
    const workspaceId = req.body.workspace || req.query.workspaceId;
    const query: any = { _id: req.params.id };
    if (workspaceId) query.workspace = workspaceId;
    else query.user = userId;
    const taskType = await TaskType.findOne(query);
    if (!taskType) return res.status(404).json({ message: 'Task type not found' });

    if (!taskType.customFields) taskType.customFields = [];
    taskType.customFields.push({ name, type, label });
    await taskType.save();
    res.json(taskType);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const removeCustomField = async (req: Request, res: Response) => {
  const { fieldName } = req.body;
  try {
    const userId = (req as any).userId;
    const workspaceId = req.body.workspace || req.query.workspaceId;
    const query: any = { _id: req.params.id };
    if (workspaceId) query.workspace = workspaceId;
    else query.user = userId;
    const taskType = await TaskType.findOne(query);
    if (!taskType) return res.status(404).json({ message: 'Task type not found' });

    taskType.customFields = taskType.customFields?.filter((f) => f.name !== fieldName) || [];
    await taskType.save();
    res.json(taskType);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
