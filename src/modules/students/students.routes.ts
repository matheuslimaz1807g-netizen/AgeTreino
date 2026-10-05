import { Router } from 'express';
import * as studentsController from './students.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly } from '../../middleware/adminOnly';
import { validate } from '../../middleware/validate';
import { createStudentSchema, updateStudentSchema, setSchedulesSchema } from './students.schema';

const router = Router();

// All student routes require auth + admin
router.use(authenticate, adminOnly);

router.get('/', studentsController.list);
router.post('/', validate(createStudentSchema), studentsController.create);
router.get('/:id', studentsController.getById);
router.patch('/:id', validate(updateStudentSchema), studentsController.update);
router.delete('/:id', studentsController.remove);

// Fixed schedule management
router.put('/:id/schedules', validate(setSchedulesSchema), studentsController.setSchedules);
router.post('/:id/sync', studentsController.syncSchedule);

export default router;
