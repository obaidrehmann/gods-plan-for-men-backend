import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id'),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
