import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    slotId: z.string().uuid('ID de slot inválido'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  }),
});

export const adminBookSchema = z.object({
  body: z.object({
    slotId: z.string().uuid('ID de slot inválido'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    guestName: z.string().min(2, 'O nome do convidado deve ter pelo menos 2 caracteres'),
  }),
});

export const cancelAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de agendamento inválido'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const getOccupancySchema = z.object({
  query: z.object({
    slotId: z.string().uuid('ID de slot inválido'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  }),
});
