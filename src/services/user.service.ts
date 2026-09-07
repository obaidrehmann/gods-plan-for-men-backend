import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { toPublicUser } from '../utils/userSerializer';

export class UserService {
  static async listUsers() {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    return users.map(toPublicUser);
  }

  static async setActiveStatus(userId: string, isActive: boolean, actorId: string) {
    if (userId === actorId) {
      throw new AppError('You cannot change your own account status', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'admin') {
      throw new AppError('Admin accounts cannot be deactivated here', 400);
    }

    user.isActive = isActive;
    await user.save();

    return toPublicUser(user);
  }
}
