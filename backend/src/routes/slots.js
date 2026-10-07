import { Router } from 'express';
import * as slotController from '../controllers/slotController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';

const router = Router();

router.param('id', validateIdParam);
router.get('/', authenticate, slotController.getSlots);
router.post('/', authenticate, authorize('admin'), slotController.createSlot);
router.delete('/:id', authenticate, authorize('admin'), slotController.deleteSlot);

export default router;
