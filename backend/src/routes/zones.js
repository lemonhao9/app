import { Router } from 'express';
import * as zoneController from '../controllers/zoneController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), zoneController.getAllZones);
router.post('/', authenticate, authorize('admin'), zoneController.createZone);
router.put('/:id', authenticate, authorize('admin'), zoneController.updateZone);
router.delete('/:id', authenticate, authorize('admin'), zoneController.desactivateZone);
router.delete('/:id/permanent', authenticate, authorize('admin'), zoneController.deleteZone);
router.get('/:id/technicians', authenticate, authorize('admin'), zoneController.getZoneTechnicians);
router.post('/:id/technicians', authenticate, authorize('admin'), zoneController.assignTechnician);
router.delete('/:id/technicians/:user_id', authenticate, authorize('admin'), zoneController.unassignTechnician);

export default router;
