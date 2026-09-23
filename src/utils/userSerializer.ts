import { toStoredMediaPath } from '../middleware/upload';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  IUser,
  NotificationPreferences,
} from '../models/User';

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
  | 'notificationPreferences'
  | 'createdAt'
  | 'updatedAt'
> & {
  _id: { toString(): string };
};

export function toNotificationPreferences(
  prefs?: Partial<NotificationPreferences> | null,
): NotificationPreferences {
  return {
    pushEnabled: prefs?.pushEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.pushEnabled,
    dailyRemindersEnabled:
      prefs?.dailyRemindersEnabled ??
      DEFAULT_NOTIFICATION_PREFERENCES.dailyRemindersEnabled,
    newChapterAlertsEnabled:
      prefs?.newChapterAlertsEnabled ??
      DEFAULT_NOTIFICATION_PREFERENCES.newChapterAlertsEnabled,
    messageOfDayEnabled:
      prefs?.messageOfDayEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.messageOfDayEnabled,
    promptAlertsEnabled:
      prefs?.promptAlertsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.promptAlertsEnabled,
  };
}

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
    notificationPreferences: toNotificationPreferences(user.notificationPreferences),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
