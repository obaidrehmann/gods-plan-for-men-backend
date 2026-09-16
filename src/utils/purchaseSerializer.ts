import { Types } from 'mongoose';
import { IBook } from '../models/Book';
import { IPurchase } from '../models/Purchase';
import { serializeBook } from './bookSerializer';

function resolveBookId(book: IPurchase['book']): string {
  if (book instanceof Types.ObjectId) {
    return book.toString();
  }

  if (typeof book === 'object' && book !== null && '_id' in book) {
    return String((book as { _id: Types.ObjectId })._id);
  }

  return String(book);
}

export function serializePurchase(purchase: IPurchase, book?: IBook | null) {
  const populated =
    !book &&
    typeof purchase.book === 'object' &&
    purchase.book !== null &&
    'title' in (purchase.book as object)
      ? (purchase.book as unknown as IBook)
      : null;

  const bookDoc = book ?? populated;

  return {
    id: purchase._id.toString(),
    bookId: resolveBookId(purchase.book),
    amount: purchase.amount,
    currency: purchase.currency,
    paymentMethod: purchase.paymentMethod,
    status: purchase.status,
    purchasedAt: purchase.purchasedAt,
    createdAt: purchase.createdAt,
    book: bookDoc ? serializeBook(bookDoc, { isPurchased: true }) : undefined,
  };
}
