import { Router } from 'express';
import { models, createResource, listResource, getResource, updateResource, deleteResource } from '../controllers/generic.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// weekly
router.post('/weekly', createResource(models.weekly));
router.get('/weekly', listResource(models.weekly));
router.get('/weekly/:id', getResource(models.weekly));
router.put('/weekly/:id', updateResource(models.weekly));
router.delete('/weekly/:id', deleteResource(models.weekly));

// monthly
router.post('/monthly', createResource(models.monthly));
router.get('/monthly', listResource(models.monthly));
router.get('/monthly/:id', getResource(models.monthly));
router.put('/monthly/:id', updateResource(models.monthly));
router.delete('/monthly/:id', deleteResource(models.monthly));

// dsa
router.post('/dsa', createResource(models.dsa));
router.get('/dsa', listResource(models.dsa));
router.get('/dsa/:id', getResource(models.dsa));
router.put('/dsa/:id', updateResource(models.dsa));
router.delete('/dsa/:id', deleteResource(models.dsa));

// backend topics
router.post('/backend-topic', createResource(models.backendTopic));
router.get('/backend-topic', listResource(models.backendTopic));
router.get('/backend-topic/:id', getResource(models.backendTopic));
router.put('/backend-topic/:id', updateResource(models.backendTopic));
router.delete('/backend-topic/:id', deleteResource(models.backendTopic));

// system design
router.post('/system-design', createResource(models.systemDesign));
router.get('/system-design', listResource(models.systemDesign));
router.get('/system-design/:id', getResource(models.systemDesign));
router.put('/system-design/:id', updateResource(models.systemDesign));
router.delete('/system-design/:id', deleteResource(models.systemDesign));

// tasks
router.post('/tasks', createResource(models.task));
router.get('/tasks', listResource(models.task));
router.get('/tasks/:id', getResource(models.task));
router.put('/tasks/:id', updateResource(models.task));
router.delete('/tasks/:id', deleteResource(models.task));

// sections (user-scoped columns for kanban)
router.post('/sections', createResource(models.section));
router.get('/sections', listResource(models.section));
router.get('/sections/:id', getResource(models.section));
router.put('/sections/:id', updateResource(models.section));
router.delete('/sections/:id', deleteResource(models.section));

// jobs
router.post('/jobs', createResource(models.job));
router.get('/jobs', listResource(models.job));
router.get('/jobs/:id', getResource(models.job));
router.put('/jobs/:id', updateResource(models.job));
router.delete('/jobs/:id', deleteResource(models.job));

export default router;
