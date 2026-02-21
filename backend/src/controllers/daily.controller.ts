import { Request, Response } from 'express';
import Daily from '../models/daily.model';

export const createDaily = async (req: Request, res: Response) => {
  const { date, ...rest } = req.body;
  try {
    // Normalize date to UTC start of day to avoid timezone shifts
    let d: Date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // client sent YYYY-MM-DD (preferred) — parse explicitly as UTC midnight
      const [y, m, day] = date.split('-').map((n) => parseInt(n, 10));
      d = new Date(Date.UTC(y, m - 1, day));
    } else {
      d = new Date(date);
    }
    const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const userId = (req as any).userId;
    // Check if entry already exists for this date for this user
    const dayStart = normalizedDate;
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    let doc = await Daily.findOne({
      user: userId,
      date: { $gte: dayStart, $lt: dayEnd }
    });
    
    if (doc) {
      // Update existing - don't overwrite tasks
      if (rest.tasks === undefined) {
        // Keep existing tasks if not provided
        Object.assign(doc, rest);
      } else {
        Object.assign(doc, rest);
      }
      await doc.save();
    } else {
      // Create new entry (attach to user)
      doc = new Daily({ user: userId, date: normalizedDate, ...rest });
      await doc.save();
    }
    
    res.status(201).json(doc);
  } catch (err: any) {
    console.error('createDaily error:', err);
    res.status(400).json({ message: err.message, details: err.errors || null });
  }
};

export const getDailies = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, startDate, endDate, date } = req.query as any;
  const q: any = {};
  const userId = (req as any).userId;
  q.user = userId;
  if (date) {
    // date may be YYYY-MM-DD or ISO; normalize to UTC day range
    let d: Date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, day] = date.split('-').map((n) => parseInt(n, 10));
      d = new Date(Date.UTC(y, m - 1, day));
    } else {
      d = new Date(date);
    }
    const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    q.date = { $gte: dayStart, $lt: dayEnd };
  } else if (startDate || endDate) {
    q.date = {};
    if (startDate) q.date.$gte = new Date(startDate);
    if (endDate) q.date.$lte = new Date(endDate);
  }
  
  const docs = await Daily.find(q)
    .sort({ date: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit);
  const total = await Daily.countDocuments(q);
  res.json({ data: docs, total });
};

export const getDaily = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const doc = await Daily.findOne({ _id: req.params.id, user: userId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};

export const updateDaily = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const doc = await Daily.findOneAndUpdate({ _id: req.params.id, user: userId }, req.body, { new: true, runValidators: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};

export const deleteDaily = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  await Daily.findOneAndDelete({ _id: req.params.id, user: userId });
  res.status(204).send();
};

export const addTask = async (req: Request, res: Response) => {
  try {
    const { title, type, customFields } = req.body;
    const daily = await Daily.findOne({ _id: req.params.id, user: (req as any).userId });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    
    if (!daily.tasks) daily.tasks = [];
    daily.tasks.push({ title, type, completed: false, customFields: customFields || {} });
    await daily.save();
    res.json(daily);
  } catch (err: any) {
    console.error('addTask error:', err);
    res.status(400).json({ message: err.message, details: err.errors || null });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, type, completed, customFields } = req.body;
    const daily = await Daily.findOne({ _id: req.params.id, user: (req as any).userId });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    
    const task = daily.tasks?.find((t) => t._id?.toString() === taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    if (title) task.title = title;
    if (type) task.type = type;
    if (completed !== undefined) task.completed = completed;
    if (customFields !== undefined) task.customFields = customFields;
    
    await daily.save();
    res.json(daily);
  } catch (err: any) {
    console.error('updateTask error:', err);
    res.status(400).json({ message: err.message, details: err.errors || null });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const daily = await Daily.findOne({ _id: req.params.id, user: (req as any).userId });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    
    daily.tasks = daily.tasks?.filter((t) => t._id?.toString() !== taskId) || [];
    await daily.save();
    res.json(daily);
  } catch (err: any) {
    console.error('deleteTask error:', err);
    res.status(400).json({ message: err.message, details: err.errors || null });
  }
};

export const toggleTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const daily = await Daily.findOne({ _id: req.params.id, user: (req as any).userId });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    
    const task = daily.tasks?.find((t) => t._id?.toString() === taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.completed = !task.completed;
    await daily.save();
    res.json(daily);
  } catch (err: any) {
    console.error('toggleTask error:', err);
    res.status(400).json({ message: err.message, details: err.errors || null });
  }
};

export const copyTaskToToday = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).userId;
    // find source daily and task
    const sourceDaily = await Daily.findOne({ _id: req.params.id, user: userId });
    if (!sourceDaily) return res.status(404).json({ message: 'Source daily not found' });
    const task = sourceDaily.tasks?.find((t) => t._id?.toString() === taskId);
    if (!task) return res.status(404).json({ message: 'Task not found in source' });

    // compute today's UTC dayStart
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    let todayDaily = await Daily.findOne({ user: userId, date: { $gte: todayStart, $lt: todayEnd } });
    if (!todayDaily) {
      todayDaily = new Daily({ user: userId, date: todayStart, tasks: [] });
    }

    // prevent duplicate (by title+type)
    const exists = todayDaily.tasks?.some((t) => t.title === task.title && t.type === task.type);
    if (exists) return res.status(409).json({ message: 'Task already exists for today' });

    todayDaily.tasks = todayDaily.tasks || [];
    todayDaily.tasks.push({ title: task.title, type: task.type, completed: false, customFields: task.customFields || {} });
    await todayDaily.save();
    res.json(todayDaily);
  } catch (err: any) {
    console.error('copyTaskToToday error:', err);
    res.status(400).json({ message: err.message });
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const { order } = req.body; // expected array of taskId strings in desired order
    if (!Array.isArray(order)) return res.status(400).json({ message: 'Order must be an array of task IDs' });
    const userId = (req as any).userId;
    const daily = await Daily.findOne({ _id: req.params.id, user: userId });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });

    const idSet = new Set(order.map((id: string) => id.toString()));
    const tasksById: any = {};
    (daily.tasks || []).forEach((t: any) => { tasksById[t._id.toString()] = t; });
    const newTasks: any[] = [];
    for (const tid of order) {
      const key = tid.toString();
      if (tasksById[key]) newTasks.push(tasksById[key]);
    }
    // append tasks not present in order array to avoid data loss
    for (const t of (daily.tasks || [])) {
      if (!idSet.has(t._id.toString())) newTasks.push(t);
    }

    daily.tasks = newTasks;
    await daily.save();
    res.json(daily);
  } catch (err: any) {
    console.error('reorderTasks error:', err);
    res.status(400).json({ message: err.message });
  }
};
