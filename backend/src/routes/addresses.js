import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as addressController from '../controllers/addressController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';

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
router.post('/', authenticate, authorize('client'), publicLookupLimiter, addressController.createAddress);
router.param('id', validateIdParam);
router.put('/:id', authenticate, authorize('client'), publicLookupLimiter, addressController.updateAddress);
router.patch('/:id/default', authenticate, authorize('client'), addressController.setDefaultAddress);
router.delete('/:id', authenticate, authorize('client'), addressController.deleteAddress);

export default router;
