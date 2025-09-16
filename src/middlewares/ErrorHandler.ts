import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError.ts';

export function ErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err instanceof AppError ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
}
