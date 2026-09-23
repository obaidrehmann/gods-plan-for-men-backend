import { Response } from 'express';
import { BookService } from '../services/book.service';
import { BookReviewService } from '../services/bookReview.service';
import { FavoriteService } from '../services/favorite.service';
import { PurchaseService } from '../services/purchase.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeBook } from '../utils/bookSerializer';
import { AppError } from '../utils/AppError';
import {
  CreateBookInput,
  CreateChapterInput,
  UpdateBookInput,
  UpdateChapterInput,
} from '../validators/book.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class BookController {
  static list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const books = await BookService.listPublished();
    const ownedIds = req.user
      ? await PurchaseService.listOwnedBookIds(req.user.id)
      : new Set<string>();
    const favoriteIds = req.user
      ? await FavoriteService.listFavoriteBookIds(req.user.id)
      : new Set<string>();
    const ratingStats = await BookReviewService.getStatsForBooks(
      books.map((book) => book._id.toString()),
    );

    const payload = books.map((book) => {
      const id = book._id.toString();
      const stats = ratingStats.get(id) ?? { averageRating: 0, ratingCount: 0 };
      return serializeBook(book, {
        isPurchased: ownedIds.has(id),
        isFavorite: favoriteIds.has(id),
        averageRating: stats.averageRating,
        ratingCount: stats.ratingCount,
      });
    });

    return sendSuccess(res, payload, 'Books fetched successfully');
  });

  static listAll = asyncHandler(async (_req, res: Response) => {
    const books = await BookService.listAll();
    const ratingStats = await BookReviewService.getStatsForBooks(
      books.map((book) => book._id.toString()),
    );
    const payload = books.map((book) => {
      const id = book._id.toString();
      const stats = ratingStats.get(id) ?? { averageRating: 0, ratingCount: 0 };
      return serializeBook(book, {
        isPurchased: true,
        averageRating: stats.averageRating,
        ratingCount: stats.ratingCount,
      });
    });
    return sendSuccess(res, payload, 'All books fetched successfully');
  });

  static getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    const book = await BookService.getById(getParam(req.params.id), isAdmin);
    const bookId = book._id.toString();
    const isPurchased =
      isAdmin ||
      (req.user ? await PurchaseService.hasPurchased(req.user.id, bookId) : false);
    const isFavorite = req.user
      ? await FavoriteService.isFavorite(req.user.id, bookId)
      : false;

    const stats = await BookReviewService.getStatsForBook(bookId);
    const mine = req.user
      ? await BookReviewService.getMineForBook(req.user.id, bookId)
      : null;

    return sendSuccess(
      res,
      serializeBook(book, {
        isPurchased,
        isFavorite,
        averageRating: stats.averageRating,
        ratingCount: stats.ratingCount,
        myReview: mine
          ? { id: mine._id.toString(), rating: mine.rating, comment: mine.comment ?? '' }
          : null,
      }),
      'Book fetched successfully',
    );
  });

  static create = asyncHandler(async (req, res: Response) => {
    const cover = req.file;
    const book = await BookService.create(req.body as CreateBookInput, cover?.filename);
    return sendSuccess(res, serializeBook(book), 'Book created successfully', 201);
  });

  static update = asyncHandler(async (req, res: Response) => {
    const book = await BookService.update(
      getParam(req.params.id),
      req.body as UpdateBookInput,
    );
    return sendSuccess(res, serializeBook(book), 'Book updated successfully');
  });

  static uploadCover = asyncHandler(async (req, res: Response) => {
    if (!req.file) {
      throw new AppError('Cover image is required', 400);
    }

    const book = await BookService.updateCover(getParam(req.params.id), req.file.filename);
    return sendSuccess(res, serializeBook(book), 'Cover updated successfully');
  });

  static remove = asyncHandler(async (req, res: Response) => {
    await BookService.remove(getParam(req.params.id));
    return sendSuccess(res, null, 'Book deleted successfully');
  });

  static addChapter = asyncHandler(async (req, res: Response) => {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const book = await BookService.addChapter(
      getParam(req.params.id),
      req.body as CreateChapterInput,
      files?.audio?.[0]?.filename,
      files?.image?.[0]?.filename,
      files?.pdf?.[0]?.filename,
    );
    return sendSuccess(
      res,
      serializeBook(book, { isPurchased: true }),
      'Chapter added successfully',
      201,
    );
  });

  static updateChapter = asyncHandler(async (req, res: Response) => {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const book = await BookService.updateChapter(
      getParam(req.params.id),
      getParam(req.params.chapterId),
      req.body as UpdateChapterInput,
      files?.audio?.[0]?.filename,
      files?.image?.[0]?.filename,
      files?.pdf?.[0]?.filename,
    );
    return sendSuccess(res, serializeBook(book, { isPurchased: true }), 'Chapter updated successfully');
  });

  static removeChapter = asyncHandler(async (req, res: Response) => {
    const book = await BookService.removeChapter(
      getParam(req.params.id),
      getParam(req.params.chapterId),
    );
    return sendSuccess(res, serializeBook(book, { isPurchased: true }), 'Chapter deleted successfully');
  });
}
