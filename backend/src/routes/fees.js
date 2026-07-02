import { Router } from 'express';
import * as feesController from '../controllers/feesController.js';

const router = Router();

router.get('/', feesController.getAllActiveFees);

export default router;
