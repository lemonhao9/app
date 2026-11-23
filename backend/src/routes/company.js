import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';

const router = Router();

router.get('/', companyController.getCompany);

export default router;
