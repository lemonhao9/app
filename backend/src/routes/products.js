import { Router } from 'express';
import * as productsController from '../controllers/productsController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';

const router = Router();

router.param('id', validateIdParam);
router.get('/', productsController.getAllActiveProducts);
router.get('/admin', authenticate, authorize('admin'), productsController.getAllProducts);
router.post('/', authenticate, authorize('admin'), productsController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productsController.updateProduct);
router.patch('/:id/activate', authenticate, authorize('admin'), productsController.activateProduct);
router.delete('/:id', authenticate, authorize('admin'), productsController.desactivateProduct);
router.delete('/:id/permanent', authenticate, authorize('admin'), productsController.deleteProduct);

export default router;
