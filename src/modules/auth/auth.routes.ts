import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authLimiter, refreshLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { loginSchema } from './auth.schema';

const router = Router();


router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
