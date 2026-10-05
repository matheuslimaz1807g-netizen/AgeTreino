import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../middleware/auth';

const BCRYPT_ROUNDS = 12;

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
  const accessToken = jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const { name, email, password } = input;

  if (!name || name.trim().length < 2) {
    throw createError('Nome deve ter pelo menos 2 caracteres.', 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError('E-mail inválido.', 400);
  }
  if (!password || password.length < 8) {
    throw createError('A senha deve ter pelo menos 8 caracteres.', 400);
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    throw createError('A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.', 400);
  }

  const existing = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw createError('E-mail já cadastrado.', 409);
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.usuario.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashed,
      role: 'admin',
    },
  });

  const tokens = generateTokens({ sub: user.id, email: user.email, role: user.role });

  return {
    usuario: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  if (!email || !password) {
    throw createError('E-mail e senha são obrigatórios.', 400);
  }

  const user = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || !user.active) {
    throw createError('Credenciais inválidas.', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createError('Credenciais inválidas.', 401);
  }

  const tokens = generateTokens({ sub: user.id, email: user.email, role: user.role });

  return {
    usuario: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

export async function refreshAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;

    const user = await prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw createError('Usuário não encontrado ou inativo.', 401);
    }

    const { accessToken } = generateTokens({ sub: user.id, email: user.email, role: user.role });
    return { accessToken };
  } catch {
    throw createError('Refresh token inválido ou expirado.', 401);
  }
}
