import { Request, Response } from 'express';
import TaskType from '../models/taskType.model';

export const createTaskType = async (req: Request, res: Response) => {
  const { name, color, customFields } = req.body;
  try {
    const userId = (req as any).userId;
    // Check if type already exists for this user
    const existing = await TaskType.findOne({ user: userId, name });
    if (existing) return res.status(409).json({ message: 'Task type already exists' });

    const type = new TaskType({ user: userId, name, color, customFields });
    await type.save();
    res.status(201).json(type);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTaskTypes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const types = await TaskType.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ data: types });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTaskType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const type = await TaskType.findOne({ _id: req.params.id, user: userId });
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
    const type = await TaskType.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { name, color, customFields },
      { new: true, runValidators: true }
    );
    if (!type) return res.status(404).json({ message: 'Task type not found' });
    res.json(type);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTaskType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await TaskType.findOneAndDelete({ _id: req.params.id, user: userId });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const addCustomField = async (req: Request, res: Response) => {
  const { name, type, label } = req.body;
  try {
    const userId = (req as any).userId;
    const taskType = await TaskType.findOne({ _id: req.params.id, user: userId });
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
    const taskType = await TaskType.findOne({ _id: req.params.id, user: userId });
    if (!taskType) return res.status(404).json({ message: 'Task type not found' });

    taskType.customFields = taskType.customFields?.filter((f) => f.name !== fieldName) || [];
    await taskType.save();
    res.json(taskType);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
