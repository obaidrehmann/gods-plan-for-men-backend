import { NextFunction, Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const token = header.slice(7);
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!user.isActive) {
      next(
        new AppError(
          'Your account has been blocked by admin',
          403,
          undefined,
          'ACCOUNT_BLOCKED',
        ),
      );
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: Array<'user' | 'admin'>) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
}
