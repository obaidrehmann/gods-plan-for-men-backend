import { Types } from 'mongoose';
import { Book } from '../models/Book';
import { BookReview } from '../models/BookReview';
import { PurchaseService } from './purchase.service';
import { AppError } from '../utils/AppError';
import {
  CreateBookReviewInput,
  UpdateBookReviewInput,
} from '../validators/bookReview.validator';

export type BookRatingStats = {
  averageRating: number;
  ratingCount: number;
};

export class BookReviewService {
  static async getStatsForBooks(bookIds: string[]): Promise<Map<string, BookRatingStats>> {
    const stats = new Map<string, BookRatingStats>();
    if (!bookIds.length) return stats;

    const objectIds = bookIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (!objectIds.length) return stats;

    const rows = await BookReview.aggregate<{
      _id: Types.ObjectId;
      averageRating: number;
      ratingCount: number;
    }>([
      { $match: { bookId: { $in: objectIds } } },
      {
        $group: {
          _id: '$bookId',
          averageRating: { $avg: '$rating' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    for (const row of rows) {
      stats.set(row._id.toString(), {
        averageRating: Math.round(row.averageRating * 10) / 10,
        ratingCount: row.ratingCount,
      });
    }

    return stats;
  }

  static async getStatsForBook(bookId: string): Promise<BookRatingStats> {
    const map = await this.getStatsForBooks([bookId]);
    return map.get(bookId) ?? { averageRating: 0, ratingCount: 0 };
  }

  static async getMineForBook(userId: string, bookId: string) {
    return BookReview.findOne({ userId, bookId });
  }

  static async listForBook(bookId: string, limit = 20) {
    return BookReview.find({ bookId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async listAllForAdmin() {
    return BookReview.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }

  static async upsert(userId: string, input: CreateBookReviewInput) {
    const book = await Book.findOne({ _id: input.bookId, isPublished: true });
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const owned = await PurchaseService.hasPurchased(userId, book._id.toString());
    if (!owned) {
      throw new AppError('Purchase this book before leaving a review', 403);
    }

    const review = await BookReview.findOneAndUpdate(
      { userId, bookId: book._id },
      {
        $set: {
          rating: input.rating,
          comment: input.comment ?? '',
          bookTitle: book.title,
        },
        $setOnInsert: {
          userId,
          bookId: book._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate('userId', 'name email');

    return review;
  }

  static async updateMine(reviewId: string, userId: string, input: UpdateBookReviewInput) {
    const review = await BookReview.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (input.rating !== undefined) review.rating = input.rating;
    if (input.comment !== undefined) review.comment = input.comment;
    await review.save();
    await review.populate('userId', 'name email');
    return review;
  }

  static async removeMine(reviewId: string, userId: string) {
    const review = await BookReview.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new AppError('Review not found', 404);
    }
    await review.deleteOne();
  }

  static async removeByAdmin(reviewId: string) {
    const review = await BookReview.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }
    await review.deleteOne();
  }
}
