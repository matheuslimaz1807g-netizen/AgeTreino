import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Erro de validação.',
      details: err.issues.map((e: ZodIssue) => ({ field: e.path.join('.'), message: e.message }))
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log only 500 errors in production, or all errors in dev
  if (!isProduction || statusCode === 500) {
    console.error(`[Error] ${err.message}`, {
      statusCode,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    error: err.isOperational ? err.message : 'Erro interno do servidor.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
