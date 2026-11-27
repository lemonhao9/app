import { Router } from 'express';
import * as bikeController from '../controllers/bikeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { uploadImage } from '../middlewares/upload.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';


const router = Router();

router.param('id', validateIdParam);
router.get('/me', authenticate, authorize('client'), bikeController.getMyBikes);
router.post('/', authenticate, authorize('client'), uploadImage('photo'), bikeController.createBike);
router.put('/:id', authenticate, authorize('client'), uploadImage('photo'), bikeController.updateBike);
router.delete('/:id', authenticate, authorize('client'), bikeController.deleteBike);


export default router;