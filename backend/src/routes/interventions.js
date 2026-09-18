import { Router } from 'express';
import * as interventionController from '../controllers/interventionController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.post('/', authenticate, authorize('client'), interventionController.createIntervention);
router.post('/:id/photos', authenticate, authorize('client', 'technician'), upload.array('photos', 6), interventionController.addPhotos);
router.get('/me', authenticate, authorize('client'), interventionController.getMyInterventions);
router.get('/today', authenticate, authorize('technician'), interventionController.getTodayForTechnician);
router.get('/history', authenticate, authorize('technician'), interventionController.getHistoryForTechnician);
router.get('/', authenticate, authorize('admin'), interventionController.getAllInterventions)
router.get('/:id', authenticate, authorize('technician', 'client', 'admin'), interventionController.getInterventionDetail);    
router.patch('/:id/start', authenticate, authorize('technician'), interventionController.startIntervention);
router.patch('/:id/complete', authenticate, authorize('technician'), interventionController.completeIntervention);
router.patch('/:id/reassign', authenticate, authorize('admin'), interventionController.reassignIntervention);
router.patch('/:id/cancel', authenticate, authorize('client', 'technician', 'admin'), interventionController.cancelIntervention);

export default router;