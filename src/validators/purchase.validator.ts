import { z } from 'zod';

export const createPurchaseSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
});

export const bookIdParamSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid book id'),
});

export const checkoutSessionParamSchema = z.object({
  sessionId: z.string().trim().min(8).max(255),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
