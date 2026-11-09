import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateAllowingPasswordChange } from '../middlewares/authenticate.js';
const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/me', authenticateAllowingPasswordChange, authController.getCurrentUser);
router.put('/password', authenticateAllowingPasswordChange, authController.changePassword);



export default router;
