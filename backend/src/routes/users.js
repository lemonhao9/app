import { Router } from 'express';
import {authenticate} from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as userController from '../controllers/usersController.js';
import { upload } from '../middlewares/upload.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';

const router = Router();

router.param('id', validateIdParam);

router.get('/', authenticate, authorize('admin'), userController.listUsers);

router.get('/:id/bikes', authenticate, authorize('admin'), userController.listUserBikes);

router.post('/technicians', authenticate, authorize('admin'), userController.createTechnician);

router.delete('/account', authenticate, userController.deleteAccount);

router.put('/me', authenticate, upload.single('picture'), userController.updateProfile);

export default router;
