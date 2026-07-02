import { Router } from 'express';
import * as productsController from '../controllers/productsController.js';

const router = Router();

router.get('/', productsController.getAllActiveProducts);

export default router;
