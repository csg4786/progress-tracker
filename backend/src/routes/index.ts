import { Router } from 'express';
import authRoutes from './auth.routes';
import dailyRoutes from './daily.routes';
import taskTypeRoutes from './taskType.routes';
import genericRoutes from './generic.routes';
import backupRoutes from './backup.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/daily', dailyRoutes);
router.use('/task-types', taskTypeRoutes);
router.use('/', genericRoutes);
router.use('/backup', backupRoutes);

export default router;
