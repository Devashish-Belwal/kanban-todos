import { Router } from 'express';
import * as sharedController from '../controllers/sharedController';

const router = Router();

// Public — no auth required
router.get('/:token', sharedController.getSharedBoard);

export default router;