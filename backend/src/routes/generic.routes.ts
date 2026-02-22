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
router.post('/sections/reorder', async (req, res) => {
  try {
    const { order } = req.body; // expected array of section IDs in desired order
    if (!Array.isArray(order)) return res.status(400).json({ message: 'Order must be an array of section IDs' });
    const userId = (req as any).userId;
    const workspaceId = req.body.workspaceId || req.query.workspaceId;

    // Update order for each section
    for (let i = 0; i < order.length; i++) {
      const sectionId = order[i];
      if (workspaceId) {
        await models.section.findOneAndUpdate({ _id: sectionId, workspace: workspaceId }, { order: i }, { new: true });
      } else {
        await models.section.findOneAndUpdate({ _id: sectionId, user: userId }, { order: i }, { new: true });
      }
    }
    
    // Return updated sections
    const sections = workspaceId
      ? await models.section.find({ workspace: workspaceId }).sort({ order: 1 })
      : await models.section.find({ user: userId }).sort({ order: 1 });
    res.json({ data: sections });
  } catch (err: any) {
    console.error('reorderSections error:', err);
    res.status(400).json({ message: err.message });
  }
});

// jobs
router.post('/jobs', createResource(models.job));
router.get('/jobs', listResource(models.job));
router.get('/jobs/:id', getResource(models.job));
router.put('/jobs/:id', updateResource(models.job));
router.delete('/jobs/:id', deleteResource(models.job));

export default router;
