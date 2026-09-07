import { z } from 'zod';

const booleanFromJson = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}, z.boolean());

export const messageIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message id'),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(500),
  isActive: booleanFromJson.optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateMessageSchema = createMessageSchema.partial().refine(
  (value) =>
    value.body !== undefined || value.isActive !== undefined || value.order !== undefined,
  { message: 'At least one field is required' },
);

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
