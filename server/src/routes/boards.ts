import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as boardController from '../controllers/boardController';
import * as sharedController from '../controllers/sharedController';

const router = Router();

router.use(requireAuth);

router.get('/', boardController.getBoards);
router.post('/', boardController.createBoard);
router.get('/:id', boardController.getBoard);
router.put('/:id', boardController.updateBoard);
router.delete('/:id', boardController.deleteBoard);

// Share management (protected — only owner)
router.post('/:boardId/share', sharedController.enableSharing);
router.delete('/:boardId/share', sharedController.revokeSharing);

export default router;