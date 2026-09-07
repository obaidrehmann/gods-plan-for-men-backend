import { avatarPublicPath, deleteUploadedFile } from '../middleware/upload';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { toPublicUser } from '../utils/userSerializer';
import {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../validators/auth.validator';

export class AuthService {
  static async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    let user;

    try {
      user = await User.create({
        name: input.name,
        email,
        password: input.password,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError('Email already registered', 409);
      }
      throw error;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: toPublicUser(user),
    };
  }

  static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(input.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError(
        'Your account has been blocked by admin',
        403,
        undefined,
        'ACCOUNT_BLOCKED',
      );
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: toPublicUser(user),
    };
  }

  static async adminLogin(input: LoginInput) {
    const result = await this.login(input);

    if (result.user.role !== 'admin') {
      throw new AppError('Admin access only', 403);
    }

    return result;
  }

  static async getProfile(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toPublicUser(user);
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (input.email !== undefined) {
      const nextEmail = input.email.toLowerCase();
      if (nextEmail !== user.email) {
        const existing = await User.findOne({ email: nextEmail });
        if (existing) {
          throw new AppError('Email already registered', 409);
        }
        user.email = nextEmail;
      }
    }

    if (input.name !== undefined) {
      user.name = input.name;
    }
    if (input.phone !== undefined) {
      user.phone = input.phone;
    }
    if (input.country !== undefined) {
      user.country = input.country;
    }
    if (input.language !== undefined) {
      user.language = input.language;
    }
    if (input.bio !== undefined) {
      user.bio = input.bio;
    }

    await user.save();
    return toPublicUser(user);
  }

  static async updateAvatar(userId: string, filename: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const previousAvatar = user.avatarUrl;
    user.avatarUrl = avatarPublicPath(filename);
    await user.save();

    if (previousAvatar && previousAvatar !== user.avatarUrl) {
      deleteUploadedFile(previousAvatar);
    }

    return toPublicUser(user);
  }
}
