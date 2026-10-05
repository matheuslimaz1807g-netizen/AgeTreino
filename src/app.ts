import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';

import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import schedulesRoutes from './modules/schedules/schedules.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import studentsRoutes from './modules/students/students.routes';

const app = express();
app.set('trust proxy', 1); // Trust first proxy (useful for rate limiter behind Nginx/Docker)

// ─── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
}));
app.use(cors({
  origin: env.nodeEnv === 'production' ? env.appUrl : true,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Rate Limiting ─────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/students', studentsRoutes);

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Static Frontend ───────────────────────────────────────────────────────
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// SPA fallback for admin panel
app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

// Default fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ─── Error Handler (must be last) ─────────────────────────────────────────
app.use(errorHandler);

export default app;
