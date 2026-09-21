import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type RequestPart = 'body' | 'query' | 'params';

function assignValidated(req: Request, part: RequestPart, data: unknown) {
  // Express 5 exposes req.query as a getter-only property.
  if (part === 'query') {
    Object.defineProperty(req, 'query', {
      value: data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return;
  }

  req[part] = data as Request[typeof part];
}

export const validate =
  (schema: ZodSchema, part: RequestPart = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(new AppError('Validation failed', 400, result.error.flatten().fieldErrors));
      return;
    }

    assignValidated(req, part, result.data);
    next();
  };
