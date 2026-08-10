import { Router } from 'express';
import {authenticate} from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as userController from '../controllers/usersController.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), userController.listUsers);

router.post('/technicians', authenticate, authorize('admin'), userController.createTechnician);

router.delete('/account', authenticate, userController.deleteAccount);

router.put('/me', authenticate, upload.single('picture'), userController.updateProfile);

export default router;
