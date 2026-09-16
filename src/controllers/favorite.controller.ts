import { Response } from 'express';
import { FavoriteService } from '../services/favorite.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { serializeBook } from '../utils/bookSerializer';
import { CreateFavoriteInput } from '../validators/favorite.validator';
import { IBook } from '../models/Book';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class FavoriteController {
  static add = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await FavoriteService.add(
      req.user.id,
      req.body as CreateFavoriteInput,
    );

    return sendSuccess(
      res,
      {
        bookId: result.book._id.toString(),
        isFavorite: true,
        alreadyFavorite: result.alreadyFavorite,
        book: serializeBook(result.book, { isFavorite: true }),
      },
      result.alreadyFavorite ? 'Book already in favorites' : 'Book added to favorites',
      result.alreadyFavorite ? 200 : 201,
    );
  });

  static remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const bookId = getParam(req.params.bookId);
    await FavoriteService.remove(req.user.id, bookId);

    return sendSuccess(
      res,
      { bookId, isFavorite: false },
      'Book removed from favorites',
    );
  });

  static listMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const favorites = await FavoriteService.listMine(req.user.id);
    const books = favorites
      .map((favorite) => favorite.book)
      .filter((book): book is IBook => Boolean(book && typeof book === 'object' && '_id' in book))
      .map((book) => serializeBook(book, { isFavorite: true }));

    return sendSuccess(res, books, 'Favorites fetched successfully');
  });

  static check = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const bookId = getParam(req.params.bookId);
    const isFavorite = await FavoriteService.isFavorite(req.user.id, bookId);

    return sendSuccess(res, { bookId, isFavorite }, 'Favorite status fetched successfully');
  });
}
