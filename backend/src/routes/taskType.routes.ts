import { Router } from 'express';
import * as ctrl from '../controllers/taskType.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/', ctrl.createTaskType);
router.get('/', ctrl.getTaskTypes);
router.get('/:id', ctrl.getTaskType);
router.put('/:id', ctrl.updateTaskType);
router.delete('/:id', ctrl.deleteTaskType);

// Custom fields
router.post('/:id/fields', ctrl.addCustomField);
router.delete('/:id/fields', ctrl.removeCustomField);

export default router;
