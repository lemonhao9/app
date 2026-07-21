import { Router } from 'express';
import * as bikeController from '../controllers/bikeController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/me', authenticate, bikeController.getMyBikes);

export default router;
