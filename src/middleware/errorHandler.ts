import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ApiErrorResponse } from '../types';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError('Route not found', 404));
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError ? err.message : 'Internal server error';

  if (env.NODE_ENV !== 'production') {
    console.error(err);
  }

  const body: ApiErrorResponse = {
    success: false,
    message,
  };

  if (err instanceof AppError && err.errors) {
    body.errors = err.errors;
  }

  return res.status(statusCode).json(body);
}
