import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdateSecurityInput,
} from '../validators/auth.validator';

export class AuthController {
  static register = asyncHandler(async (req, res: Response) => {
    const result = await AuthService.register(req.body as RegisterInput);
    return sendSuccess(res, result, 'Registered successfully', 201);
  });

  static login = asyncHandler(async (req, res: Response) => {
    const result = await AuthService.login(req.body as LoginInput);
    return sendSuccess(res, result, 'Logged in successfully');
  });

  static adminLogin = asyncHandler(async (req, res: Response) => {
    const result = await AuthService.adminLogin(req.body as LoginInput);
    return sendSuccess(res, result, 'Admin logged in successfully');
  });

  static me = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await AuthService.getProfile(req.user.id);
    return sendSuccess(res, user, 'Profile fetched successfully');
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await AuthService.updateProfile(
      req.user.id,
      req.body as UpdateProfileInput,
    );
    return sendSuccess(res, user, 'Profile updated successfully');
  });

  static updateAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.file) {
      throw new AppError('Avatar image is required', 400);
    }

    const user = await AuthService.updateAvatar(req.user.id, req.file.filename);
    return sendSuccess(res, user, 'Avatar updated successfully');
  });

  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await AuthService.changePassword(
      req.user.id,
      req.body as ChangePasswordInput,
    );
    return sendSuccess(res, user, 'Password updated successfully');
  });

  static updateSecurity = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await AuthService.updateSecurity(
      req.user.id,
      req.body as UpdateSecurityInput,
    );
    return sendSuccess(res, user, 'Security settings updated successfully');
  });
}
