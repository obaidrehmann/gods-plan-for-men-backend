import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { UpdateUserStatusInput } from '../validators/user.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class UserController {
  static list = asyncHandler(async (_req, res: Response) => {
    const users = await UserService.listUsers();
    return sendSuccess(res, users, 'Users fetched successfully');
  });

  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { isActive } = req.body as UpdateUserStatusInput;
    const user = await UserService.setActiveStatus(
      getParam(req.params.id),
      isActive,
      req.user.id,
    );

    return sendSuccess(
      res,
      user,
      isActive ? 'User activated successfully' : 'User deactivated successfully',
    );
  });
}
