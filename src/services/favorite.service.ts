import { Book } from '../models/Book';
import { Favorite } from '../models/Favorite';
import { AppError } from '../utils/AppError';
import { CreateFavoriteInput } from '../validators/favorite.validator';

export class FavoriteService {
  static async isFavorite(userId: string, bookId: string) {
    const existing = await Favorite.findOne({
      user: userId,
      book: bookId,
    }).lean();

    return Boolean(existing);
  }

  static async listFavoriteBookIds(userId: string) {
    const favorites = await Favorite.find({ user: userId }).select('book').lean();
    return new Set(favorites.map((favorite) => favorite.book.toString()));
  }

  static async listMine(userId: string) {
    return Favorite.find({ user: userId }).populate('book').sort({ createdAt: -1 });
  }

  static async add(userId: string, input: CreateFavoriteInput) {
    const book = await Book.findOne({ _id: input.bookId, isPublished: true });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const existing = await Favorite.findOne({
      user: userId,
      book: book._id,
    });

    if (existing) {
      return { favorite: existing, book, alreadyFavorite: true };
    }

    const favorite = await Favorite.create({
      user: userId,
      book: book._id,
    });

    return { favorite, book, alreadyFavorite: false };
  }

  static async remove(userId: string, bookId: string) {
    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      book: bookId,
    });

    if (!favorite) {
      throw new AppError('Favorite not found', 404);
    }

    return favorite;
  }

  static async removeForBook(bookId: string) {
    await Favorite.deleteMany({ book: bookId });
  }
}
