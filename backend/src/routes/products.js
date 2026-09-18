import { Router } from 'express';
import * as productsController from '../controllers/productsController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/', productsController.getAllActiveProducts);
router.get('/admin', authenticate, authorize('admin'), productsController.getAllProducts);
router.post('/', authenticate, authorize('admin'), productsController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productsController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productsController.desactivateProduct);
router.delete('/:id/permanent', authenticate, authorize('admin'), productsController.deleteProduct);

export default router;
