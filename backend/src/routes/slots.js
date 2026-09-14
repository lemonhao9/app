import { Router } from 'express';
import * as slotController from '../controllers/slotController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/', authenticate, slotController.getSlots);
router.post('/', authenticate, authorize('admin'), slotController.createSlot);
router.delete('/:id', authenticate, authorize('admin'), slotController.deleteSlot);

export default router;
