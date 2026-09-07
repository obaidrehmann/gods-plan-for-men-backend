import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload, UserRole } from '../types';
import { AppError } from './AppError';

interface SignTokenInput {
  id: string;
  email: string;
  role: UserRole;
}

export function signToken(payload: SignTokenInput): string {
  return jwt.sign(
    {
      email: payload.email,
      role: payload.role,
    },
    env.JWT_SECRET,
    {
      subject: payload.id,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  );
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}
