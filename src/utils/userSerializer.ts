import { toStoredMediaPath } from '../middleware/upload';
import { IUser } from '../models/User';

type PublicUserSource = Pick<
  IUser,
  | 'name'
  | 'email'
  | 'role'
  | 'isActive'
  | 'phone'
  | 'country'
  | 'language'
  | 'bio'
  | 'avatarUrl'
  | 'passwordChangedAt'
  | 'loginAlertsEnabled'
  | 'createdAt'
  | 'updatedAt'
> & {
  _id: { toString(): string };
};

export function toPublicUser(user: PublicUserSource) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    phone: user.phone ?? '',
    country: user.country ?? '',
    language: user.language ?? '',
    bio: user.bio ?? '',
    // Relative path only — clients prepend their API origin.
    avatarUrl: toStoredMediaPath(user.avatarUrl),
    passwordChangedAt: user.passwordChangedAt ?? user.createdAt,
    loginAlertsEnabled: user.loginAlertsEnabled ?? false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
