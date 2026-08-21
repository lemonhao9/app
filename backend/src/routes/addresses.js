import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as addressController from '../controllers/addressController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

const publicLookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/geocode', publicLookupLimiter, addressController.geocode);
router.get('/zone', publicLookupLimiter, addressController.getZoneForPoint);
router.get('/me', authenticate, addressController.getMyAddresses);

export default router;
