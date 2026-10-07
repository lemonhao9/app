import { Router } from 'express';
import * as bikeController from '../controllers/bikeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.get('/me', authenticate, authorize('client'), bikeController.getMyBikes);
router.post('/', authenticate, authorize('client'), upload.single('photo'), bikeController.createBike);
router.put('/:id', authenticate, authorize('client'), upload.single('photo'), bikeController.updateBike);
router.delete('/:id', authenticate, authorize('client'), bikeController.deleteBike);


export default router;