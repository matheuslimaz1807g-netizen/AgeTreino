import { Router } from 'express';
import * as schedulesController from './schedules.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly } from '../../middleware/adminOnly';
import { validate } from '../../middleware/validate';
import { createScheduleSchema, updateScheduleSchema, toggleScheduleSchema } from './schedules.schema';

const router = Router();

// Public (authenticated) — students can see available slots
router.get('/available', authenticate, schedulesController.getAvailable);

// Admin only
router.get('/', authenticate, adminOnly, schedulesController.list);
router.get('/:id', authenticate, adminOnly, schedulesController.getById);
router.post('/', authenticate, adminOnly, validate(createScheduleSchema), schedulesController.create);
router.patch('/:id', authenticate, adminOnly, validate(updateScheduleSchema), schedulesController.update);
router.patch('/:id/toggle', authenticate, adminOnly, validate(toggleScheduleSchema), schedulesController.toggle);

export default router;
