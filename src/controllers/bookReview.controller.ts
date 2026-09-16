import { Response } from 'express';
import { BookReviewService } from '../services/bookReview.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  serializeBookReview,
  serializeBookReviews,
} from '../utils/bookReviewSerializer';
import {
  CreateBookReviewInput,
  UpdateBookReviewInput,
} from '../validators/bookReview.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function requireUser(req: AuthRequest) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export class BookReviewController {
  static upsert = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const review = await BookReviewService.upsert(user.id, req.body as CreateBookReviewInput);
    return sendSuccess(res, serializeBookReview(review!), 'Review saved successfully', 201);
  });

  static updateMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const review = await BookReviewService.updateMine(
      getParam(req.params.id),
      user.id,
      req.body as UpdateBookReviewInput,
    );
    return sendSuccess(res, serializeBookReview(review), 'Review updated successfully');
  });

  static removeMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    await BookReviewService.removeMine(getParam(req.params.id), user.id);
    return sendSuccess(res, null, 'Review deleted successfully');
  });

  static mineForBook = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const review = await BookReviewService.getMineForBook(
      user.id,
      getParam(req.params.bookId),
    );
    return sendSuccess(
      res,
      review ? serializeBookReview(review) : null,
      'Review fetched successfully',
    );
  });

  static listForBook = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await BookReviewService.listForBook(getParam(req.params.bookId));
    const stats = await BookReviewService.getStatsForBook(getParam(req.params.bookId));
    return sendSuccess(
      res,
      {
        ...stats,
        reviews: serializeBookReviews(reviews),
      },
      'Book reviews fetched successfully',
    );
  });

  static listAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const reviews = await BookReviewService.listAllForAdmin();
    return sendSuccess(res, serializeBookReviews(reviews), 'Reviews fetched successfully');
  });

  static removeAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    await BookReviewService.removeByAdmin(getParam(req.params.id));
    return sendSuccess(res, null, 'Review deleted successfully');
  });
}
