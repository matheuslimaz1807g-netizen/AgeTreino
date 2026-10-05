import { prisma } from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import { isSlotInPast, parseDateOnlyUTC } from '../../utils/appTime';
import { notifyNewAppointment } from '../notifications/notifications.service';

interface CreateAppointmentInput {
  userId: string;
  slotId: string;
  date: string; // YYYY-MM-DD
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { userId, slotId, date: dateStr } = input;

  const dateOnly = parseDateOnlyUTC(dateStr);
  if (!dateOnly) {
    throw createError('Data inválida. Use formato YYYY-MM-DD.', 400);
  }

  // Check if slot exists and is active
  const slot = await prisma.horarioGrade.findUnique({ where: { id: slotId } });
  if (!slot) throw createError('Horário não encontrado.', 404);
  if (!slot.active) throw createError('Este horário não está disponível.', 400);

  if (isSlotInPast(dateOnly, slot.startTime)) {
    throw createError('Não é possível agendar horários que já passaram.', 400);
  }

  // Check day-of-week matches
  if (slot.dayOfWeek !== dateOnly.getUTCDay()) {
    throw createError('A data selecionada não corresponde ao dia deste horário.', 400);
  }

  // Use a transaction with SELECT FOR UPDATE to prevent race conditions
  const appointment = await prisma.$transaction(async (tx) => {
    // Lock the rows of existing appointments for this slot+date
    // This prevents concurrent transactions from reading stale counts
    await tx.$executeRaw`
      SELECT id FROM agendamentos
      WHERE slot_id = ${slotId}
        AND date = ${dateOnly}::date
        AND status IN ('pending', 'confirmed')
      FOR UPDATE
    `;

    // Count active appointments after lock
    const count = await tx.agendamento.count({
      where: {
        slotId,
        date: dateOnly,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (count >= slot.capacity) {
      throw createError('Não há vagas disponíveis neste horário.', 409);
    }

    // Check for duplicate appointment by same user
    const existing = await tx.agendamento.findUnique({
      where: { studentId_slotId_date: { studentId: userId, slotId, date: dateOnly } },
    });
    if (existing) {
      if (existing.status === 'cancelled') {
        throw createError('Você já realizou e cancelou um agendamento neste horário. Entre em contato com a academia.', 409);
      }
      throw createError('Você já possui um agendamento neste horário.', 409);
    }

    return tx.agendamento.create({
      data: { userId, slotId, date: dateOnly, status: 'pending' },
      include: {
        usuario: { select: { id: true, name: true, email: true } },
        aluno: { select: { id: true, name: true, phone: true } },
        slot: true,
      },
    });
  });

  // Notify admin after successful booking (outside transaction)
  await notifyNewAppointment(appointment).catch((err) => {
    console.error('[Notificacao] Failed to notify admin:', err);
  });

  return appointment;
}

// ─── Admin Manual Booking ─────────────────────────────────────────────────
interface AdminBookInput {
  slotId: string;
  date: string; // YYYY-MM-DD
  guestName: string;
}

export async function adminBook(input: AdminBookInput) {
  const { slotId, date: dateStr, guestName } = input;

  if (!guestName || guestName.trim().length < 2) {
    throw createError('Nome do aluno deve ter pelo menos 2 caracteres.', 400);
  }

  const dateOnly = parseDateOnlyUTC(dateStr);
  if (!dateOnly) {
    throw createError('Data inválida. Use formato YYYY-MM-DD.', 400);
  }

  const slot = await prisma.horarioGrade.findUnique({ where: { id: slotId } });
  if (!slot) throw createError('Horário não encontrado.', 404);
  if (!slot.active) throw createError('Este horário não está disponível.', 400);

  if (isSlotInPast(dateOnly, slot.startTime)) {
    throw createError('Não é possível agendar horários que já passaram.', 400);
  }

  const appointment = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT id FROM agendamentos
      WHERE slot_id = ${slotId}
        AND date = ${dateOnly}::date
        AND status IN ('pending', 'confirmed')
      FOR UPDATE
    `;

    const count = await tx.agendamento.count({
      where: { slotId, date: dateOnly, status: { in: ['pending', 'confirmed'] } },
    });

    if (count >= slot.capacity) {
      throw createError('Não há vagas disponíveis neste horário.', 409);
    }

    return tx.agendamento.create({
      data: {
        userId: null,
        guestName: guestName.trim(),
        slotId,
        date: dateOnly,
        status: 'confirmed', // Admin bookings are auto-confirmed
      },
      include: { slot: true },
    });
  });

  return appointment;
}

export async function listAppointments(filters: {
  userId?: string;
  slotId?: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, slotId, date: dateStr, status, page = 1, limit = 20 } = filters;

  let dateFilter: Date | undefined;
  if (dateStr) {
    // Use parseDateOnlyUTC for consistent YYYY-MM-DD parsing across all functions
    const parsed = parseDateOnlyUTC(dateStr);
    if (parsed) {
      dateFilter = parsed;
    }
  }

  const where = {
    ...(userId ? { userId } : {}),
    ...(slotId ? { slotId } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
    ...(status ? { status: status as 'pending' | 'confirmed' | 'cancelled' } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.agendamento.count({ where }),
    prisma.agendamento.findMany({
      where,
      include: {
        usuario: { select: { id: true, name: true, email: true } },
        aluno: { select: { id: true, name: true, phone: true } },
        slot: true,
      },
      orderBy: [{ date: 'asc' }, { slot: { startTime: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { total, page, limit, items };
}

export async function getAppointmentById(id: string, requestingUserId: string, requestingRole: string) {
  const appointment = await prisma.agendamento.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, name: true, email: true } },
      aluno: { select: { id: true, name: true, phone: true } },
      slot: true,
    },
  });

  if (!appointment) throw createError('Agendamento não encontrado.', 404);

  // Students can only see their own appointments
  if (requestingRole !== 'admin' && appointment.userId !== requestingUserId) {
    throw createError('Acesso não autorizado.', 403);
  }

  return appointment;
}

export async function cancelAppointment(
  id: string,
  requestingUserId: string,
  requestingRole: string,
  reason?: string
) {
  const appointment = await prisma.agendamento.findUnique({ where: { id } });
  if (!appointment) throw createError('Agendamento não encontrado.', 404);

  // Students can only cancel their own appointments
  if (requestingRole !== 'admin' && appointment.userId !== requestingUserId) {
    throw createError('Acesso não autorizado.', 403);
  }

  if (appointment.status === 'cancelled') {
    throw createError('Este agendamento já está cancelado.', 400);
  }

  return prisma.agendamento.update({
    where: { id },
    data: {
      status: 'cancelled',
      cancelledBy: requestingRole === 'admin' ? 'admin' : 'student',
      cancelReason: reason ?? null,
    },
    include: {
      usuario: { select: { id: true, name: true, email: true } },
      aluno: { select: { id: true, name: true, phone: true } },
      slot: true,
    },
  });
}

export async function confirmAppointment(id: string) {
  const appointment = await prisma.agendamento.findUnique({ where: { id } });
  if (!appointment) throw createError('Agendamento não encontrado.', 404);

  if (appointment.status !== 'pending') {
    throw createError(`Agendamento não pode ser confirmado (status atual: ${appointment.status}).`, 400);
  }

  return prisma.agendamento.update({
    where: { id },
    data: { status: 'confirmed' },
    include: {
      usuario: { select: { id: true, name: true, email: true } },
      aluno: { select: { id: true, name: true, phone: true } },
      slot: true,
    },
  });
}

export async function getSlotOccupancy(slotId: string, dateStr: string) {
  const dateOnly = parseDateOnlyUTC(dateStr);
  if (!dateOnly) {
    throw createError('Data inválida. Use formato YYYY-MM-DD.', 400);
  }

  const slot = await prisma.horarioGrade.findUnique({ where: { id: slotId } });
  if (!slot) throw createError('Horário não encontrado.', 404);

  const appointments = await prisma.agendamento.findMany({
    where: {
      slotId,
      date: dateOnly,
      status: { in: ['pending', 'confirmed'] },
    },
    include: {
      usuario: { select: { id: true, name: true, email: true } },
      aluno: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const pending = appointments.filter((a) => a.status === 'pending');
  const confirmed = appointments.filter((a) => a.status === 'confirmed');

  return {
    slot,
    date: dateOnly,
    capacity: slot.capacity,
    booked: appointments.length,
    available: slot.capacity - appointments.length,
    isFull: appointments.length >= slot.capacity,
    pendingCount: pending.length,
    confirmedCount: confirmed.length,
    appointments,
  };
}
