import { z } from 'zod';

const booleanFromForm = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}, z.boolean());

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1),
  shortBlurb: z.string().trim().max(500).optional(),
  isPublished: booleanFromForm.optional(),
  isFeatured: booleanFromForm.optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bookIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
});

export const chapterIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
  chapterId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chapter id'),
});

export const createChapterSchema = z.object({
  number: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(200),
  duration: z.string().trim().min(1).max(20),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateChapterSchema = createChapterSchema.partial();

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
