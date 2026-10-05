import { prisma } from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import { isSlotInPast, parseDateOnlyUTC } from '../../utils/appTime';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function validateTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

interface CreateSlotInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
}

interface UpdateSlotInput {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  active?: boolean;
}

export async function listSlots(filters?: { dayOfWeek?: number; active?: boolean }) {
  return prisma.horarioGrade.findMany({
    where: {
      ...(filters?.dayOfWeek !== undefined ? { dayOfWeek: filters.dayOfWeek } : {}),
      ...(filters?.active !== undefined ? { active: filters.active } : {}),
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function getSlotById(id: string) {
  const slot = await prisma.horarioGrade.findUnique({ where: { id } });
  if (!slot) throw createError('Horário não encontrado.', 404);
  return slot;
}

export async function createSlot(input: CreateSlotInput) {
  const { dayOfWeek, startTime, endTime, capacity } = input;

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw createError('Dia da semana inválido (0=Dom, 6=Sáb).', 400);
  }
  if (!validateTimeFormat(startTime)) {
    throw createError('Horário de início inválido. Use formato HH:MM.', 400);
  }
  if (!validateTimeFormat(endTime)) {
    throw createError('Horário de fim inválido. Use formato HH:MM.', 400);
  }
  if (startTime >= endTime) {
    throw createError('Horário de início deve ser anterior ao fim.', 400);
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    throw createError('Capacidade deve ser entre 1 e 100.', 400);
  }

  try {
    return await prisma.horarioGrade.create({
      data: { dayOfWeek, startTime, endTime, capacity },
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw createError(
        `Já existe um horário às ${startTime} na ${DAY_NAMES[dayOfWeek]}.`,
        409
      );
    }
    throw err;
  }
}

export async function updateSlot(id: string, input: UpdateSlotInput) {
  const slot = await prisma.horarioGrade.findUnique({ where: { id } });
  if (!slot) throw createError('Horário não encontrado.', 404);

  if (input.startTime && !validateTimeFormat(input.startTime)) {
    throw createError('Horário de início inválido. Use formato HH:MM.', 400);
  }
  if (input.endTime && !validateTimeFormat(input.endTime)) {
    throw createError('Horário de fim inválido. Use formato HH:MM.', 400);
  }

  const newStart = input.startTime ?? slot.startTime;
  const newEnd = input.endTime ?? slot.endTime;
  if (newStart >= newEnd) {
    throw createError('Horário de início deve ser anterior ao fim.', 400);
  }
  if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) {
    throw createError('Capacidade deve ser um inteiro positivo.', 400);
  }

  return prisma.horarioGrade.update({
    where: { id },
    data: input,
  });
}

export async function toggleSlotActive(id: string, active: boolean) {
  const slot = await prisma.horarioGrade.findUnique({ where: { id } });
  if (!slot) throw createError('Horário não encontrado.', 404);
  return prisma.horarioGrade.update({ where: { id }, data: { active } });
}

/**
 * Returns available slots for a given date, including occupied/total counts.
 * Only active slots matching the day-of-week of the provided date are returned.
 */
export async function getAvailableSlots(dateStr: string) {
  const dateOnly = parseDateOnlyUTC(dateStr);
  if (!dateOnly) {
    throw createError('Data inválida. Use formato YYYY-MM-DD.', 400);
  }

  const dayOfWeek = dateOnly.getUTCDay();

  const slots = await prisma.horarioGrade.findMany({
    where: { dayOfWeek, active: true },
    orderBy: { startTime: 'asc' },
  });

  const results = await Promise.all(
    slots.filter((slot) => !isSlotInPast(dateOnly, slot.startTime)).map(async (slot) => {
      const count = await prisma.agendamento.count({
        where: {
          slotId: slot.id,
          date: dateOnly,
          status: { in: ['pending', 'confirmed'] },
        },
      });

      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: count,
        available: slot.capacity - count,
        isFull: count >= slot.capacity,
      };
    })
  );

  return results;
}
