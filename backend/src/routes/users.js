import { Router } from 'express';
import {authenticate} from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as userController from '../controllers/usersController.js';
import { upload } from '../middlewares/upload.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';

const router = Router();

router.param('id', validateIdParam);

router.get('/', authenticate, authorize('admin'), userController.listUsers);

router.get('/clients', authenticate, authorize('admin'), userController.listClients);

router.get('/:id/bikes', authenticate, authorize('admin'), userController.listUserBikes);

router.post('/technicians', authenticate, authorize('admin'), userController.createTechnician);

router.post('/:id/temporary-password', authenticate, authorize('admin'), userController.regenerateTemporaryPassword);

router.delete('/account', authenticate, authorize('client'), userController.deleteAccount);

router.put('/me', authenticate, upload.single('picture'), userController.updateProfile);

router.put('/:id', authenticate, authorize('admin'), userController.updateUserByAdmin);

router.patch('/:id/deactivate', authenticate, authorize('admin'), userController.deactivateUser);

router.patch('/:id/activate', authenticate, authorize('admin'), userController.activateUser);

export default router;
