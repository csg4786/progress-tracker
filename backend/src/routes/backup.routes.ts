import { Router } from 'express';
import { exportAll, importAll } from '../controllers/backup.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/export', exportAll);
router.post('/import', importAll);

export default router;
