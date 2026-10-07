import { Router } from 'express';
import * as feesController from '../controllers/feesController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';

const router = Router();

router.param('id', validateIdParam);
router.get('/', feesController.getAllActiveFees);
router.get('/admin', authenticate, authorize('admin'), feesController.getAllFees);
router.post('/', authenticate, authorize('admin'), feesController.createFee);
router.put('/:id', authenticate, authorize('admin'), feesController.updateFee);
router.patch('/:id/activate', authenticate, authorize('admin'), feesController.activateFee);
router.delete('/:id', authenticate, authorize('admin'), feesController.desactivateFee);
router.delete('/:id/permanent', authenticate, authorize('admin'), feesController.deleteFee);

export default router;
