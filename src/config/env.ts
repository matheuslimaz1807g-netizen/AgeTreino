import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue = ''): string {
  return process.env[name] ?? defaultValue;
}

const nodeEnv = optional('NODE_ENV', 'development');
const jwtSecret = required('JWT_SECRET');
const jwtRefreshSecret = required('JWT_REFRESH_SECRET');

// In production, enforce minimum secret length to prevent weak secrets
if (nodeEnv === 'production') {
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET deve ter no mínimo 32 caracteres em produção.');
  }
  if (jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres em produção.');
  }
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD é obrigatória em produção. Não use a senha padrão.');
  }
}

export const env = {
  nodeEnv,
  port: parseInt(optional('PORT', '3000'), 10),
  databaseUrl: required('DATABASE_URL'),

  jwt: {
    secret: jwtSecret,
    refreshSecret: jwtRefreshSecret,
    expiresIn: optional('JWT_EXPIRES_IN', '8h'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  admin: {
    name: optional('ADMIN_NAME', 'Administrador'),
    email: optional('ADMIN_EMAIL', 'admin@actionfitness.com.br'),
    // No default password — must be set explicitly via environment variable
    password: required('ADMIN_PASSWORD'),
  },

  smtp: {
    host: optional('SMTP_HOST'),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    secure: optional('SMTP_SECURE', 'false') === 'true',
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('SMTP_FROM', 'Age Treino Studio Personal <noreply@agetreino.com.br>'),
    enabled: !!optional('SMTP_HOST'),
  },

  appUrl: optional('APP_URL', 'http://localhost:3000'),
  appTimeZone: optional('APP_TIME_ZONE', 'America/Sao_Paulo'),
} as const;
