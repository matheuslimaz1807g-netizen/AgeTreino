import { z } from 'zod';

const PARTNER_TYPES = ['wellhub', 'totalpass', 'classpass', 'particular'] as const;
const PLAN_TYPES = ['twice_a_week', 'three_times_a_week', 'monthly_free'] as const;

const horarioFixoSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use formato HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use formato HH:MM'),
});

export const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
    phone: z.string().max(20).optional(),
    documentId: z.string().max(50).optional(),
    partnerType: z.enum(PARTNER_TYPES, { message: 'Tipo de parceiro inválido.' }),
    planType: z.enum(PLAN_TYPES, { message: 'Tipo de plano inválido.' }),
  }),
});

export const updateStudentSchema = z.object({
  body: createStudentSchema.shape.body.partial().extend({ active: z.boolean().optional() })
});

export const setSchedulesSchema = z.object({
  body: z.object({
    horarios: z.array(horarioFixoSchema).max(7, 'Máximo 7 horários fixos por aluno.'),
  })
});
