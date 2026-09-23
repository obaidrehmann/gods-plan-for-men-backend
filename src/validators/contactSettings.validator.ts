import { z } from 'zod';

export const updateContactSettingsSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').max(255).optional(),
    phone: z.string().trim().min(3, 'Phone is required').max(80).optional(),
    hours: z.string().trim().min(2, 'Hours are required').max(200).optional(),
    replyTime: z
      .string()
      .trim()
      .min(2, 'Reply time is required')
      .max(200)
      .optional(),
  })
  .refine(
    (data) =>
      data.email !== undefined ||
      data.phone !== undefined ||
      data.hours !== undefined ||
      data.replyTime !== undefined,
    { message: 'At least one contact field is required' },
  );

export type UpdateContactSettingsInput = z.infer<typeof updateContactSettingsSchema>;
