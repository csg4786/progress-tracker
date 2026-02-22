import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  shareWorkspace,
  listMembers,
  searchUsers
} from '../controllers/workspace.controller';

const router = Router();

router.use(authenticate);

router.post('/workspaces', createWorkspace);
router.get('/workspaces', listWorkspaces);
router.get('/workspaces/:id', getWorkspace);
router.put('/workspaces/:id', updateWorkspace);
router.delete('/workspaces/:id', deleteWorkspace);

router.post('/workspaces/:id/share', shareWorkspace);
router.get('/workspaces/:id/members', listMembers);

// user search to add collaborators
router.get('/users/search', searchUsers);

export default router;
