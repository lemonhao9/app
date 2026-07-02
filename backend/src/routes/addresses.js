import { Router } from 'express';
import * as addressController from '../controllers/addressController.js';

const router = Router();

router.get('/geocode', addressController.geocode);

export default router;
