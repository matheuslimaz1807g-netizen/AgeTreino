import { prisma } from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import { parseDateOnlyUTC } from '../../utils/appTime';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// ─── Helper to resolve matching HorarioGrade ────────────────────────────────
async function resolveSlot(dayOfWeek: number, startTime: string) {
  const slot = await prisma.horarioGrade.findFirst({
    where: { dayOfWeek, startTime, active: true },
  });
  return slot;
}

// ─── Sync fixed schedules to appointments ───────────────────────────────────
// For a student's fixed schedule, generate bookings for the next `weeksAhead` weeks.
const WEEKS_AHEAD = 12;

export async function syncStudentSchedule(studentId: string) {
  const student = await prisma.aluno.findUnique({
    where: { id: studentId },
    include: { horariosFixos: true },
  });
  if (!student || !student.active) return;

  const today = new Date();
  const results: { created: number; conflicts: string[] } = { created: 0, conflicts: [] };

  for (const hf of student.horariosFixos) {
    const slot = await resolveSlot(hf.dayOfWeek, hf.startTime);
    if (!slot) {
      results.conflicts.push(
        `Nenhuma turma ativa encontrada para ${DAY_NAMES[hf.dayOfWeek]} às ${hf.startTime}.`
      );
      continue;
    }

    // Iterate for WEEKS_AHEAD weeks
    for (let w = 0; w < WEEKS_AHEAD; w++) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      // Move to the correct day of week
      const currentDay = date.getUTCDay();
      let daysUntil = hf.dayOfWeek - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && w === 0)) daysUntil += 7;
      date.setUTCDate(date.getUTCDate() + daysUntil + w * 7);

      // Skip if date already passed
      if (date < new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))) {
        continue;
      }

      // Check if booking already exists for this student/slot/date
      const existing = await prisma.agendamento.findFirst({
        where: { studentId, slotId: slot.id, date },
      });
      if (existing) continue;

      // Use a transaction with locking to prevent overbooking
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`
            SELECT id FROM agendamentos
            WHERE slot_id = ${slot.id}
              AND date = ${date}::date
              AND status IN ('pending', 'confirmed')
            FOR UPDATE
          `;

          const count = await tx.agendamento.count({
            where: { slotId: slot.id, date, status: { in: ['pending', 'confirmed'] } },
          });

          if (count >= slot.capacity) {
            results.conflicts.push(
              `Turma ${DAY_NAMES[hf.dayOfWeek]} ${hf.startTime} lotada para ${date.toISOString().split('T')[0]}.`
            );
            return;
          }

          await tx.agendamento.create({
            data: {
              studentId,
              userId: null,
              slotId: slot.id,
              date,
              status: 'confirmed',
            },
          });
          results.created++;
        });
      } catch {
        results.conflicts.push(
          `Erro ao reservar ${DAY_NAMES[hf.dayOfWeek]} ${hf.startTime} em ${date.toISOString().split('T')[0]}.`
        );
      }
    }
  }

  return results;
}

// ─── CRUD Students ────────────────────────────────────────────────────────────

export interface CreateStudentInput {
  name: string;
  phone?: string;
  documentId?: string;
  partnerType: 'wellhub' | 'totalpass' | 'classpass' | 'particular';
  planType: 'twice_a_week' | 'three_times_a_week' | 'monthly_free';
}

export async function createStudent(input: CreateStudentInput) {
  return prisma.aluno.create({
    data: {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      documentId: input.documentId?.trim() || null,
      partnerType: input.partnerType,
      planType: input.planType,
    },
  });
}

export async function listStudents(filters?: { active?: boolean; search?: string }) {
  return prisma.aluno.findMany({
    where: {
      ...(filters?.active !== undefined ? { active: filters.active } : {}),
      ...(filters?.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
    },
    include: {
      horariosFixos: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getStudentById(id: string) {
  const student = await prisma.aluno.findUnique({
    where: { id },
    include: {
      horariosFixos: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  if (!student) throw createError('Aluno não encontrado.', 404);
  return student;
}

export async function updateStudent(id: string, input: Partial<CreateStudentInput> & { active?: boolean }) {
  const student = await prisma.aluno.findUnique({ where: { id } });
  if (!student) throw createError('Aluno não encontrado.', 404);

  return prisma.aluno.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.documentId !== undefined ? { documentId: input.documentId?.trim() || null } : {}),
      ...(input.partnerType !== undefined ? { partnerType: input.partnerType } : {}),
      ...(input.planType !== undefined ? { planType: input.planType } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    include: {
      horariosFixos: true,
    },
  });
}

export async function deleteStudent(id: string) {
  const student = await prisma.aluno.findUnique({ where: { id } });
  if (!student) throw createError('Aluno não encontrado.', 404);

  // Soft delete: mark as inactive
  return prisma.aluno.update({
    where: { id },
    data: { active: false },
  });
}

// ─── Fixed Schedule CRUD ─────────────────────────────────────────────────────

export interface HorarioFixoInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function validateTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export async function setStudentSchedules(studentId: string, horarios: HorarioFixoInput[]) {
  const student = await prisma.aluno.findUnique({ where: { id: studentId } });
  if (!student) throw createError('Aluno não encontrado.', 404);

  // Validate all inputs first
  for (const h of horarios) {
    if (h.dayOfWeek < 0 || h.dayOfWeek > 6) {
      throw createError(`Dia da semana inválido: ${h.dayOfWeek}. Use 0 (Dom) a 6 (Sáb).`, 400);
    }
    if (!validateTimeFormat(h.startTime)) {
      throw createError(`Horário de início inválido: "${h.startTime}". Use HH:MM.`, 400);
    }
    if (!validateTimeFormat(h.endTime)) {
      throw createError(`Horário de fim inválido: "${h.endTime}". Use HH:MM.`, 400);
    }
    if (h.startTime >= h.endTime) {
      throw createError('Horário de início deve ser anterior ao fim.', 400);
    }
    // Validate that a matching grade slot exists
    const slot = await resolveSlot(h.dayOfWeek, h.startTime);
    if (!slot) {
      throw createError(
        `Não existe turma ativa para ${DAY_NAMES[h.dayOfWeek]} às ${h.startTime}. Crie o horário na grade primeiro.`,
        422
      );
    }
  }

  // Replace all fixed schedules atomically
  await prisma.$transaction(async (tx) => {
    await tx.horarioFixo.deleteMany({ where: { studentId } });
    if (horarios.length > 0) {
      await tx.horarioFixo.createMany({
        data: horarios.map((h) => ({
          studentId,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
        })),
      });
    }
  });

  // Trigger async schedule sync
  syncStudentSchedule(studentId).catch((err) =>
    console.error(`[syncStudentSchedule] Error for student ${studentId}:`, err)
  );

  return getStudentById(studentId);
}
