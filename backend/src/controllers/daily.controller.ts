import { Request, Response } from 'express';
import Daily from '../models/daily.model';

export const createDaily = async (req: Request, res: Response) => {
  const { date, ...rest } = req.body;
  try {
    console.debug('createDaily called', { body: req.body, query: req.query });
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
    const workspaceId = (req.body.workspace || req.query.workspaceId) as string | undefined;
    console.debug('createDaily params', { userId, workspaceId, normalizedDate });
    // Check if entry already exists for this date for this user or workspace
    const dayStart = normalizedDate;
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    let doc;
    if (workspaceId) {
      doc = await Daily.findOne({ workspace: workspaceId, date: { $gte: dayStart, $lt: dayEnd } });
    } else {
      doc = await Daily.findOne({ user: userId, date: { $gte: dayStart, $lt: dayEnd } });
    }

    if (doc) {
      // Update existing - don't overwrite tasks unless provided
      if (rest.tasks === undefined) {
        Object.assign(doc, rest);
      } else {
        Object.assign(doc, rest);
      }
      await doc.save();
    } else {
      // Create new entry (attach to user or workspace)
      if (workspaceId) doc = new Daily({ workspace: workspaceId, date: normalizedDate, ...rest });
      else doc = new Daily({ user: userId, date: normalizedDate, ...rest });
      try {
        await doc.save();
      } catch (saveErr: any) {
        console.error('createDaily save error', saveErr);
        // Handle legacy documents that may have `user: null` causing unique index collisions
        if (saveErr && saveErr.code === 11000 && saveErr.keyPattern && saveErr.keyPattern.user && workspaceId) {
          try {
            const existing = await Daily.findOneAndUpdate(
              { user: null, date: { $gte: dayStart, $lt: dayEnd } },
              { $set: { workspace: workspaceId, date: normalizedDate, ...rest } },
              { new: true, runValidators: true }
            );
            if (existing) {
              doc = existing;
            } else {
              throw saveErr;
            }
          } catch (mergeErr: any) {
            console.error('createDaily merge fallback failed', mergeErr);
            throw saveErr;
          }
        } else {
          throw saveErr;
        }
      }
    }
    
    res.status(201).json(doc);
  } catch (err: any) {
    console.error('createDaily error:', err?.message || err, err?.stack || '');
    const details = err?.errors || err?.code ? { code: err.code } : null;
    res.status(400).json({ message: err.message || 'Failed to create daily', details });
  }
};

export const getDailies = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, startDate, endDate, date } = req.query as any;
  const q: any = {};
  const userId = (req as any).userId;
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  if (workspaceId) q.workspace = workspaceId;
  else q.user = userId;
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
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  const doc = workspaceId
    ? await Daily.findOne({ _id: req.params.id, workspace: workspaceId })
    : await Daily.findOne({ _id: req.params.id, user: userId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  // If workspace-scoped, verify membership
  if (doc.workspace) {
    const ws = await (await import('../models/workspace.model')).default.findOne({ _id: doc.workspace, $or: [{ owner: userId }, { 'members.user': userId }] });
    if (!ws) return res.status(403).json({ message: 'Access denied' });
  }
  res.json(doc);
};

export const updateDaily = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  let doc;
  if (workspaceId) {
    // verify membership
    const Workspace = (await import('../models/workspace.model')).default;
    const ok = await Workspace.findOne({ _id: workspaceId, $or: [{ owner: userId }, { 'members.user': userId }] });
    if (!ok) return res.status(403).json({ message: 'Access denied' });
    doc = await Daily.findOneAndUpdate({ _id: req.params.id, workspace: workspaceId }, req.body, { new: true, runValidators: true });
  } else {
    doc = await Daily.findOneAndUpdate({ _id: req.params.id, user: userId }, req.body, { new: true, runValidators: true });
  }
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};

export const deleteDaily = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const workspaceId = (req.query as any).workspaceId as string | undefined;
  if (workspaceId) {
    const Workspace = (await import('../models/workspace.model')).default;
    const ok = await Workspace.findOne({ _id: workspaceId, $or: [{ owner: userId }, { 'members.user': userId }] });
    if (!ok) return res.status(403).json({ message: 'Access denied' });
    await Daily.findOneAndDelete({ _id: req.params.id, workspace: workspaceId });
  } else {
    await Daily.findOneAndDelete({ _id: req.params.id, user: userId });
  }
  res.status(204).send();
};

export const addTask = async (req: Request, res: Response) => {
  try {
    const { title, type, customFields } = req.body;
    const daily = await Daily.findOne({ _id: req.params.id });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    // if workspace-scoped, verify membership
    if (daily.workspace) {
      const Workspace = (await import('../models/workspace.model')).default;
      const ok = await Workspace.findOne({ _id: daily.workspace, $or: [{ owner: (req as any).userId }, { 'members.user': (req as any).userId }] });
      if (!ok) return res.status(403).json({ message: 'Access denied' });
    } else if (daily.user.toString() !== (req as any).userId) {
      return res.status(404).json({ message: 'Daily entry not found' });
    }
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
    const daily = await Daily.findOne({ _id: req.params.id });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    if (daily.workspace) {
      const Workspace = (await import('../models/workspace.model')).default;
      const ok = await Workspace.findOne({ _id: daily.workspace, $or: [{ owner: (req as any).userId }, { 'members.user': (req as any).userId }] });
      if (!ok) return res.status(403).json({ message: 'Access denied' });
    } else if (daily.user.toString() !== (req as any).userId) {
      return res.status(404).json({ message: 'Daily entry not found' });
    }
    
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
    const daily = await Daily.findOne({ _id: req.params.id });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    if (daily.workspace) {
      const Workspace = (await import('../models/workspace.model')).default;
      const ok = await Workspace.findOne({ _id: daily.workspace, $or: [{ owner: (req as any).userId }, { 'members.user': (req as any).userId }] });
      if (!ok) return res.status(403).json({ message: 'Access denied' });
    } else if (daily.user.toString() !== (req as any).userId) {
      return res.status(404).json({ message: 'Daily entry not found' });
    }
    
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
    const userId = (req as any).userId;
    const daily = await Daily.findOne({ _id: req.params.id });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    // check access
    if (daily.workspace) {
      const Workspace = (await import('../models/workspace.model')).default;
      const ok = await Workspace.findOne({ _id: daily.workspace, $or: [{ owner: userId }, { 'members.user': userId }] });
      if (!ok) return res.status(403).json({ message: 'Access denied' });
    } else if (daily.user.toString() !== userId) {
      return res.status(404).json({ message: 'Daily entry not found' });
    }

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
    const sourceDaily = await Daily.findOne({ _id: req.params.id });
    if (!sourceDaily) return res.status(404).json({ message: 'Source daily not found' });
    if (sourceDaily.workspace) {
      const Workspace = (await import('../models/workspace.model')).default;
      const ok = await Workspace.findOne({ _id: sourceDaily.workspace, $or: [{ owner: userId }, { 'members.user': userId }] });
      if (!ok) return res.status(403).json({ message: 'Access denied' });
    } else if (sourceDaily.user.toString() !== userId) {
      return res.status(404).json({ message: 'Source daily not found' });
    }
    const task = sourceDaily.tasks?.find((t) => t._id?.toString() === taskId);
    if (!task) return res.status(404).json({ message: 'Task not found in source' });

    // compute today's UTC dayStart
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    let todayDaily = await Daily.findOne({ user: userId, date: { $gte: todayStart, $lt: todayEnd } });
    // If the source is workspace-scoped, create today's in that workspace
    if (sourceDaily.workspace) {
      todayDaily = await Daily.findOne({ workspace: sourceDaily.workspace, date: { $gte: todayStart, $lt: todayEnd } });
      if (!todayDaily) {
        todayDaily = new Daily({ workspace: sourceDaily.workspace, date: todayStart, tasks: [] });
      }
    } else {
      if (!todayDaily) {
        todayDaily = new Daily({ user: userId, date: todayStart, tasks: [] });
      }
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
    const daily = await Daily.findOne({ _id: req.params.id });
    if (!daily) return res.status(404).json({ message: 'Daily entry not found' });
    if (daily.workspace) {
      const Workspace = (await import('../models/workspace.model')).default;
      const ok = await Workspace.findOne({ _id: daily.workspace, $or: [{ owner: userId }, { 'members.user': userId }] });
      if (!ok) return res.status(403).json({ message: 'Access denied' });
    } else if (daily.user.toString() !== userId) {
      return res.status(404).json({ message: 'Daily entry not found' });
    }

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
