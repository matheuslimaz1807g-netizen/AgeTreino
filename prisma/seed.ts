import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Iniciando...');

  // ─── Admin ───────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@actionfitness.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@2026!';
  const adminName = process.env.ADMIN_NAME ?? 'Administrador';

  const existingAdmin = await prisma.usuario.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.usuario.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashed,
        role: 'admin',
      },
    });
    console.log(`[Seed] Admin criado: ${adminEmail}`);
  } else {
    console.log(`[Seed] Admin já existe: ${adminEmail}`);
  }

  // ─── Default Schedule Slots ───────────────────────────────────────────────
  // Monday (1) to Saturday (6), 3 slots per day
  const defaultSlots = [
    // Segunda a Sexta
    ...([1, 2, 3, 4, 5].flatMap((day) => [
      { dayOfWeek: day, startTime: '08:00', endTime: '09:00', capacity: 6 },
      { dayOfWeek: day, startTime: '09:00', endTime: '10:00', capacity: 6 },
      { dayOfWeek: day, startTime: '10:00', endTime: '11:00', capacity: 6 },
      { dayOfWeek: day, startTime: '17:00', endTime: '18:00', capacity: 6 },
      { dayOfWeek: day, startTime: '18:00', endTime: '19:00', capacity: 6 },
      { dayOfWeek: day, startTime: '19:00', endTime: '20:00', capacity: 6 },
    ])),
    // Sábado
    { dayOfWeek: 6, startTime: '08:00', endTime: '09:00', capacity: 8 },
    { dayOfWeek: 6, startTime: '09:00', endTime: '10:00', capacity: 8 },
    { dayOfWeek: 6, startTime: '10:00', endTime: '11:00', capacity: 8 },
  ];

  let slotsCreated = 0;
  for (const slot of defaultSlots) {
    const existing = await prisma.horarioGrade.findFirst({
      where: { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime },
    });
    if (!existing) {
      await prisma.horarioGrade.create({ data: slot });
      slotsCreated++;
    }
  }
  console.log(`[Seed] ${slotsCreated} horários criados (${defaultSlots.length - slotsCreated} já existiam).`);

  console.log('[Seed] Concluído.');
}

main()
  .catch((err) => {
    console.error('[Seed] Erro:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
