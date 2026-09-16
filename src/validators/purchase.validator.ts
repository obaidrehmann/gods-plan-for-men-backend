import { z } from 'zod';

export const createPurchaseSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
});

export const bookIdParamSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
