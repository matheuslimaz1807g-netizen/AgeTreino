import { z } from 'zod';

export const createScheduleSchema = z.object({
  body: z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    capacity: z.number().min(1).max(100),
  }),
});

export const updateScheduleSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    dayOfWeek: z.number().min(0).max(6).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
    capacity: z.number().min(1).max(100).optional(),
  }),
});

export const toggleScheduleSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    active: z.boolean(),
  }),
});
