import { Router } from 'express';
import * as bikeController from '../controllers/bikeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.get('/me', authenticate, bikeController.getMyBikes);
router.post('/', authenticate, upload.single('photo'), bikeController.createBike);
export default router;
