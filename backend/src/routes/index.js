import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import bikeRoutes from './bikes.js';
import addressRoutes from './addresses.js';
import zoneRoutes from './zones.js';
import feeRoutes from './fees.js';
import slotRoutes from './slots.js';
import interventionRoutes from './interventions.js';
import productRoutes from './products.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/bikes', bikeRoutes);
router.use('/addresses', addressRoutes);
router.use('/zones', zoneRoutes);
router.use('/fees', feeRoutes);
router.use('/slots', slotRoutes);
router.use('/interventions', interventionRoutes);
router.use('/products', productRoutes);

export default router;
