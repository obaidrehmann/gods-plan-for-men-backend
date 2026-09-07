import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

export class AuthController {
  static register = asyncHandler(async (req, res: Response) => {
    const result = await AuthService.register(req.body as RegisterInput);
    return sendSuccess(res, result, 'Registered successfully', 201);
  });

  static login = asyncHandler(async (req, res: Response) => {
    const result = await AuthService.login(req.body as LoginInput);
    return sendSuccess(res, result, 'Logged in successfully');
  });

  static me = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await AuthService.getProfile(req.user.id);
    return sendSuccess(res, user, 'Profile fetched successfully');
  });
}
