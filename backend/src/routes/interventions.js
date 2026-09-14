import { Router } from 'express';
import * as interventionController from '../controllers/interventionController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.post('/', authenticate, authorize('client'), interventionController.createIntervention);
router.post('/:id/photos', authenticate, authorize('client'), upload.array('photos', 6), interventionController.addPhotos);
router.patch('/:id/cancel', authenticate, authorize('client'), interventionController.cancelIntervention);
router.get('/me', authenticate, interventionController.getMyInterventions);


export default router;