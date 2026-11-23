import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/', companyController.getCompany);

router.put('/', authenticate, authorize('admin'), companyController.updateCompany);

export default router;
