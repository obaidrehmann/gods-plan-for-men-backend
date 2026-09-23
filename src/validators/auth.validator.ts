import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    email: z.string().trim().email('Invalid email address').max(255).optional(),
    phone: z.string().trim().max(40, 'Phone number is too long').optional(),
    country: z.string().trim().max(100, 'Country is too long').optional(),
    language: z.string().trim().max(50, 'Language is too long').optional(),
    bio: z.string().trim().max(500, 'Bio must be 500 characters or less').optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined ||
      data.country !== undefined ||
      data.language !== undefined ||
      data.bio !== undefined,
    { message: 'At least one profile field is required' },
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128),
});

export const updateSecuritySchema = z
  .object({
    loginAlertsEnabled: z.boolean().optional(),
  })
  .refine((data) => data.loginAlertsEnabled !== undefined, {
    message: 'At least one security field is required',
  });

export const updateNotificationPreferencesSchema = z
  .object({
    pushEnabled: z.boolean().optional(),
    dailyRemindersEnabled: z.boolean().optional(),
    newChapterAlertsEnabled: z.boolean().optional(),
    messageOfDayEnabled: z.boolean().optional(),
    promptAlertsEnabled: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.pushEnabled !== undefined ||
      data.dailyRemindersEnabled !== undefined ||
      data.newChapterAlertsEnabled !== undefined ||
      data.messageOfDayEnabled !== undefined ||
      data.promptAlertsEnabled !== undefined,
    { message: 'At least one notification preference is required' },
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateSecurityInput = z.infer<typeof updateSecuritySchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
