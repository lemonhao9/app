import { Router } from 'express';
import {authenticate} from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as userController from '../controllers/usersController.js';

const router = Router();

router.post('/technicians', authenticate, authorize('admin'), userController.createTechnician);

router.delete('/account', authenticate, userController.deleteAccount);

export default router;
