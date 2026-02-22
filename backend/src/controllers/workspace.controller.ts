import { Request, Response } from 'express';
import Workspace from '../models/workspace.model';
import User from '../models/user.model';
import Daily from '../models/daily.model';
import TaskType from '../models/taskType.model';
import Section from '../models/section.model';
import Task from '../models/task.model';
import { Types } from 'mongoose';

const ensureMemberOrOwner = async (workspaceId: string, userId: string) => {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return null;
  if (ws.owner.toString() === userId) return { ws, role: 'owner' };
  const member = ws.members.find((m: any) => m.user.toString() === userId);
  if (member) return { ws, role: member.role };
  return null;
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, description } = req.body;
    const ws = new Workspace({ name, description, owner: userId, members: [] });
    await ws.save();
    res.status(201).json(ws);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const listWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const workspaces = await Workspace.find({ $or: [{ owner: userId }, { 'members.user': userId }] })
      .populate('owner', 'username')
      .populate('members.user', 'username')
      .sort({ updatedAt: -1 });
    // normalize members to include user object
    const normalized = workspaces.map((w: any) => ({
      _id: w._id,
      name: w.name,
      description: w.description,
      owner: w.owner,
      members: w.members
    }));
    res.json({ data: normalized });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const ok = await ensureMemberOrOwner(id, userId);
    if (!ok) return res.status(403).json({ message: 'Access denied' });
    res.json(ok.ws);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const ok = await ensureMemberOrOwner(id, userId);
    if (!ok) return res.status(403).json({ message: 'Access denied' });
    // allow owner and editors to update basic fields
    if (ok.role !== 'owner' && ok.role !== 'editor') return res.status(403).json({ message: 'Insufficient permissions' });
    const ws = await Workspace.findByIdAndUpdate(id, { name: req.body.name, description: req.body.description }, { new: true, runValidators: true });
    res.json(ws);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    console.debug('deleteWorkspace called', { id, userId });
    const ws = await Workspace.findById(id);
    if (!ws) return res.status(404).json({ message: 'Not found' });
    if (ws.owner.toString() !== userId) return res.status(403).json({ message: 'Only owner can delete workspace' });

    // Cascade-delete workspace-scoped documents to keep DB clean
    try {
      await Promise.all([
        Daily.deleteMany({ workspace: id }),
        TaskType.deleteMany({ workspace: id }),
        Section.deleteMany({ workspace: id }),
        Task.deleteMany({ workspace: id })
      ]);
    } catch (cascadeErr: any) {
      console.error('Error deleting workspace-scoped docs', cascadeErr);
      // continue to attempt workspace deletion
    }

    // delete workspace itself
    try {
      await Workspace.findByIdAndDelete(id);
    } catch (delErr: any) {
      console.error('Error deleting workspace', delErr);
      return res.status(400).json({ message: delErr.message || 'Failed to delete workspace' });
    }

    res.status(204).send();
  } catch (err: any) {
    console.error('deleteWorkspace error', err);
    res.status(400).json({ message: err.message });
  }
};

export const listMembers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const ok = await ensureMemberOrOwner(id, userId);
    if (!ok) return res.status(403).json({ message: 'Access denied' });
    const ws = ok.ws;
    // populate users
    const members = await Promise.all(ws.members.map(async (m: any) => {
      const u = await User.findById(m.user).select('username');
      return { user: u, role: m.role };
    }));
    // include owner
    const owner = await User.findById(ws.owner).select('username');
    res.json({ owner, members });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const shareWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { userId: targetUserId, role } = req.body;
    const ws = await Workspace.findById(id);
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    if (ws.owner.toString() !== userId) return res.status(403).json({ message: 'Only owner can share workspace' });
    if (!Types.ObjectId.isValid(targetUserId)) return res.status(400).json({ message: 'Invalid userId' });
    // remove if role === 'remove'
    if (role === 'remove') {
      ws.members = ws.members.filter((m: any) => m.user.toString() !== targetUserId);
    } else {
      const existing = ws.members.find((m: any) => m.user.toString() === targetUserId);
      if (existing) existing.role = role;
      else ws.members.push({ user: targetUserId, role });
    }
    await ws.save();
    res.json(ws);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q) return res.json({ data: [] });
    const users = await User.find({ username: { $regex: q, $options: 'i' } }).limit(10).select('username');
    res.json({ data: users });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
