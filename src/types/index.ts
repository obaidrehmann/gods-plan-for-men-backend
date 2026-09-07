import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
}
