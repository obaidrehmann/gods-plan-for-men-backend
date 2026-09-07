import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1),
  coverUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bookIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
