import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const booleanFromJson = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}, z.boolean());

const targetSchema = z.object({
  bookId: objectId,
  chapterId: objectId,
});

export const reflectionPromptIdParamSchema = z.object({
  id: objectId,
});

export const listReflectionPromptsQuerySchema = z.object({
  bookId: objectId,
  chapterId: objectId,
});

export const createReflectionPromptSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  targets: z.array(targetSchema).min(1),
  isActive: booleanFromJson.optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateReflectionPromptSchema = z
  .object({
    body: z.string().trim().min(1).max(2000).optional(),
    targets: z.array(targetSchema).min(1).optional(),
    isActive: booleanFromJson.optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (value) =>
      value.body !== undefined ||
      value.targets !== undefined ||
      value.isActive !== undefined ||
      value.order !== undefined,
    { message: 'At least one field is required' },
  );

export type CreateReflectionPromptInput = z.infer<typeof createReflectionPromptSchema>;
export type UpdateReflectionPromptInput = z.infer<typeof updateReflectionPromptSchema>;
export type ListReflectionPromptsQuery = z.infer<typeof listReflectionPromptsQuerySchema>;
