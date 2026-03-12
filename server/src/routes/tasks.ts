import { Router } from 'express';
import { requireAuthOrShareEdit } from '../middleware/sharedAuth';
import * as taskController from '../controllers/taskController';

const router = Router({ mergeParams: true });

router.use(requireAuthOrShareEdit);

router.post('/', taskController.createTask);
router.put('/reorder', taskController.reorderTasks);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

export default router;