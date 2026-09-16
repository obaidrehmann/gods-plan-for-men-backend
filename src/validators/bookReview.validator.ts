import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createBookReviewSchema = z.object({
  bookId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default(''),
});

export const updateBookReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).optional(),
});

export const bookReviewIdParamSchema = z.object({
  id: objectId,
});

export const bookReviewBookIdParamSchema = z.object({
  bookId: objectId,
});

export type CreateBookReviewInput = z.infer<typeof createBookReviewSchema>;
export type UpdateBookReviewInput = z.infer<typeof updateBookReviewSchema>;
