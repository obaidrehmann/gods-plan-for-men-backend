import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });

    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
    });

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
}
