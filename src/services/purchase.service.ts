import { Book } from '../models/Book';
import { Purchase } from '../models/Purchase';
import { AppError } from '../utils/AppError';
import { CreatePurchaseInput } from '../validators/purchase.validator';

export class PurchaseService {
  static async hasPurchased(userId: string, bookId: string) {
    const existing = await Purchase.findOne({
      user: userId,
      book: bookId,
      status: 'completed',
    }).lean();

    return Boolean(existing);
  }

  static async listOwnedBookIds(userId: string) {
    const purchases = await Purchase.find({
      user: userId,
      status: 'completed',
    })
      .select('book')
      .lean();

    return new Set(purchases.map((purchase) => purchase.book.toString()));
  }

  static async listMine(userId: string) {
    return Purchase.find({ user: userId, status: 'completed' })
      .populate('book')
      .sort({ purchasedAt: -1 });
  }

  /**
   * Simple checkout placeholder. Records ownership immediately.
   * Replace the body of this method with Stripe PaymentIntent confirmation later.
   */
  static async purchaseSimple(userId: string, input: CreatePurchaseInput) {
    const book = await Book.findOne({ _id: input.bookId, isPublished: true });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const existing = await Purchase.findOne({
      user: userId,
      book: book._id,
      status: 'completed',
    });

    if (existing) {
      return { purchase: existing, book, alreadyOwned: true };
    }

    const purchase = await Purchase.create({
      user: userId,
      book: book._id,
      amount: book.price,
      currency: book.currency || 'USD',
      paymentMethod: 'simple',
      status: 'completed',
      purchasedAt: new Date(),
    });

    return { purchase, book, alreadyOwned: false };
  }

  static async removeForBook(bookId: string) {
    await Purchase.deleteMany({ book: bookId });
  }
}
