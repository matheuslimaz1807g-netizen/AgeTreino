import { Router } from 'express';
import * as appointmentsController from './appointments.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly } from '../../middleware/adminOnly';
import { validate } from '../../middleware/validate';
import { createAppointmentSchema, adminBookSchema, cancelAppointmentSchema, getOccupancySchema } from './appointments.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student + Admin
router.post('/', validate(createAppointmentSchema), appointmentsController.create);
router.get('/', appointmentsController.list);
router.get('/:id', appointmentsController.getById);
router.patch('/:id/cancel', validate(cancelAppointmentSchema), appointmentsController.cancel);

// Admin only
router.post('/admin-book', adminOnly, validate(adminBookSchema), appointmentsController.adminBook);
router.patch('/:id/confirm', adminOnly, appointmentsController.confirm);
router.get('/occupancy/detail', adminOnly, validate(getOccupancySchema), appointmentsController.occupancy);

export default router;
