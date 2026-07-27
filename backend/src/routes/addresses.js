import { Router } from 'express';
import * as addressController from '../controllers/addressController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/geocode', addressController.geocode);
router.get('/me', authenticate, addressController.getMyAddresses);

export default router;
