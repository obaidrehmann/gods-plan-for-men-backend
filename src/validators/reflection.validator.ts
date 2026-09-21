import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const reflectionIdParamSchema = z.object({
  id: objectId,
});

export const createReflectionSchema = z.object({
  bookId: objectId,
  chapterId: objectId,
  body: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200).optional(),
});

export const updateReflectionSchema = z
  .object({
    bookId: objectId.optional(),
    chapterId: objectId.optional(),
    body: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).max(200).optional(),
  })
  .refine(
    (value) =>
      value.body !== undefined ||
      value.title !== undefined ||
      value.bookId !== undefined ||
      value.chapterId !== undefined,
    { message: 'At least one field is required' },
  )
  .refine(
    (value) => {
      const hasBook = value.bookId !== undefined;
      const hasChapter = value.chapterId !== undefined;
      return hasBook === hasChapter;
    },
    { message: 'bookId and chapterId must be provided together' },
  );

export const adminRespondSchema = z.object({
  body: z.string().trim().min(1).max(5000).optional(),
  response: z.string().trim().min(1).max(5000).optional(),
}).refine((value) => Boolean(value.body?.trim() || value.response?.trim()), {
  message: 'Message body is required',
});

export const reflectionMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export type CreateReflectionInput = z.infer<typeof createReflectionSchema>;
export type UpdateReflectionInput = z.infer<typeof updateReflectionSchema>;
export type AdminRespondInput = z.infer<typeof adminRespondSchema>;
export type ReflectionMessageInput = {
  body?: string;
  response?: string;
};
