import { Router } from 'express';
import * as ctrl from '../controllers/daily.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/', ctrl.createDaily);
router.get('/', ctrl.getDailies);
router.get('/:id', ctrl.getDaily);
router.put('/:id', ctrl.updateDaily);
router.delete('/:id', ctrl.deleteDaily);

// Task management endpoints
router.post('/:id/tasks', ctrl.addTask);
router.put('/:id/tasks/:taskId', ctrl.updateTask);
router.delete('/:id/tasks/:taskId', ctrl.deleteTask);
router.patch('/:id/tasks/:taskId/toggle', ctrl.toggleTask);
router.post('/:id/tasks/:taskId/copy-to-today', ctrl.copyTaskToToday);
router.post('/:id/tasks/reorder', ctrl.reorderTasks);

export default router;
