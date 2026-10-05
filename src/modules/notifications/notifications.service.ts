import { prisma } from '../../config/database';
import { sendMail } from '../../config/mailer';
import { env } from '../../config/env';

interface AppointmentWithRelations {
  id: string;
  date: Date;
  status: string;
  usuario: { id: string; name: string; email: string } | null;
  guestName?: string | null;
  slot: { startTime: string; endTime: string };
}

/**
 * Notifies all admins about a new appointment.
 * Creates in-app notifications and optionally sends e-mail.
 */
export async function notifyNewAppointment(appointment: AppointmentWithRelations): Promise<void> {
  const admins = await prisma.usuario.findMany({
    where: { role: 'admin', active: true },
    select: { id: true, email: true, name: true },
  });

  if (admins.length === 0) return;

  const studentName = appointment.usuario ? appointment.usuario.name : (appointment.guestName || 'Aluno');
  const studentEmail = appointment.usuario ? appointment.usuario.email : 'N/A (Inscrição Manual)';

  const payload = {
    appointmentId: appointment.id,
    studentName,
    studentEmail,
    date: appointment.date.toISOString().split('T')[0],
    startTime: appointment.slot.startTime,
    endTime: appointment.slot.endTime,
  };

  // 1. In-app notifications
  await prisma.notificacao.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: 'new_appointment',
      payload,
    })),
  });

  // 2. E-mail notifications (optional)
  const dateFormatted = new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  for (const admin of admins) {
    await sendMail({
      to: admin.email,
      subject: `Novo agendamento — ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Novo Agendamento Pendente</h2>
          <p>Olá, ${admin.name}!</p>
          <p>Um novo agendamento foi solicitado e aguarda sua confirmação.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Aluno</td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">E-mail</td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Data</td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Horário</td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${appointment.slot.startTime} – ${appointment.slot.endTime}</td>
            </tr>
          </table>
          <a href="${env.appUrl}/admin/" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Abrir Painel
          </a>
        </div>
      `,
    }).catch((err) => {
      console.error(`[Mailer] Falha ao enviar e-mail para ${admin.email}:`, err);
    });
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notificacao.count({ where: { userId, read: false } });
}

export async function listNotifications(userId: string, page = 1, limit = 30) {
  const [total, items] = await Promise.all([
    prisma.notificacao.count({ where: { userId } }),
    prisma.notificacao.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { total, page, limit, items };
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notificacao.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notificacao.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
