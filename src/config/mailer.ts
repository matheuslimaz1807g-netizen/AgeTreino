import nodemailer from 'nodemailer';
import { env } from './env';

let transporter: nodemailer.Transporter | null = null;

if (env.smtp.enabled) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!transporter) {
    console.log(`[Mailer] SMTP desativado. E-mail não enviado para ${options.to}: ${options.subject}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    ...options,
  });
}

export const mailerEnabled = env.smtp.enabled;
