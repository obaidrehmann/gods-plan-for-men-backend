import Stripe from 'stripe';
import { Book, IBook } from '../models/Book';
import { IPurchase, PaymentMethod, Purchase, PurchaseStatus } from '../models/Purchase';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { CreatePurchaseInput } from '../validators/purchase.validator';
import {
  getPublishableKey,
  getStripe,
  paymentIntentId,
  toMinorUnits,
} from './stripe.service';

const MIN_STRIPE_AMOUNT = 0.5;

export type CheckoutResult = {
  purchase: IPurchase;
  book: IBook;
  alreadyOwned: boolean;
  clientSecret: string | null;
  publishableKey: string | null;
  paymentIntentId: string | null;
};

export type SalesReport = {
  completedCount: number;
  refundedCount: number;
  pendingCount: number;
  byCurrency: Array<{
    currency: string;
    grossRevenue: number;
    saleCount: number;
  }>;
  byBook: Array<{
    bookId: string;
    title: string;
    currency: string;
    saleCount: number;
    grossRevenue: number;
  }>;
  recent: Array<{
    id: string;
    bookId: string;
    bookTitle: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PurchaseStatus;
    purchasedAt: Date;
    createdAt: Date;
  }>;
};

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

function readField(value: unknown, field: string): string {
  if (value && typeof value === 'object' && field in value) {
    const raw = (value as Record<string, unknown>)[field];
    return typeof raw === 'string' ? raw : '';
  }

  return '';
}

function readId(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: { toString(): string } })._id);
  }

  return String(value ?? '');
}

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
   * Free titles are granted immediately. Paid titles return a PaymentIntent
   * client secret for the in-app card sheet.
   */
  static async purchase(userId: string, input: CreatePurchaseInput) {
    return this.startCheckout(userId, input.bookId);
  }

  static async startCheckout(userId: string, bookId: string): Promise<CheckoutResult> {
    const book = await Book.findOne({ _id: bookId, isPublished: true });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    if (book.price <= 0) {
      return this.grantFree(userId, book);
    }

    if (book.price < MIN_STRIPE_AMOUNT) {
      throw new AppError('Book price must be at least 0.50 to charge with Stripe', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    const existing = await this.findOrCreatePending(userId, book);

    if (existing.status === 'completed') {
      return {
        purchase: existing,
        book,
        alreadyOwned: true,
        clientSecret: null,
        publishableKey: null,
        paymentIntentId: existing.stripePaymentIntentId ?? null,
      };
    }

    const publishableKey = getPublishableKey();

    const stripe = getStripe();
    const amount = toMinorUnits(book.price);
    const currency = (book.currency || 'USD').toLowerCase();

    if (existing.stripePaymentIntentId) {
      const reusable = await this.reusablePaymentIntent(
        existing.stripePaymentIntentId,
        amount,
        currency,
      );
      if (reusable) {
        return {
          purchase: existing,
          book,
          alreadyOwned: false,
          clientSecret: reusable.clientSecret,
          publishableKey,
          paymentIntentId: reusable.id,
        };
      }
    }

    let intent: Stripe.PaymentIntent;

    try {
      intent = await stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
        receipt_email: user.email,
        description: book.title.slice(0, 250),
        metadata: {
          userId,
          bookId: book.id,
          purchaseId: existing.id,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to start card payment';
      throw new AppError(message, 502);
    }

    if (!intent.client_secret) {
      throw new AppError('Stripe did not return a payment client secret', 502);
    }

    existing.stripePaymentIntentId = intent.id;
    existing.paymentMethod = 'stripe';
    existing.status = 'pending';
    existing.amount = book.price;
    existing.currency = book.currency || 'USD';
    await existing.save();

    return {
      purchase: existing,
      book,
      alreadyOwned: false,
      clientSecret: intent.client_secret,
      publishableKey,
      paymentIntentId: intent.id,
    };
  }

  static async confirmCheckoutSession(userId: string, sessionId: string): Promise<CheckoutResult> {
    const stripe = getStripe();
    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      throw new AppError('Checkout session not found', 404);
    }

    if (session.metadata?.userId !== userId) {
      throw new AppError('Checkout session not found', 404);
    }

    if (session.payment_status === 'paid') {
      await this.fulfillCheckoutSession(session);
    }

    const purchase = await Purchase.findOne({
      user: userId,
      stripeCheckoutSessionId: sessionId,
    });

    if (!purchase) {
      throw new AppError('Checkout session not found', 404);
    }

    const book = await Book.findById(purchase.book);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return {
      purchase,
      book,
      alreadyOwned: purchase.status === 'completed',
      clientSecret: null,
      publishableKey: null,
      paymentIntentId: paymentIntentId(session),
    };
  }

  static async confirmPaymentIntent(
    userId: string,
    paymentIntentIdValue: string,
  ): Promise<CheckoutResult> {
    const stripe = getStripe();
    let intent: Stripe.PaymentIntent;

    try {
      intent = await stripe.paymentIntents.retrieve(paymentIntentIdValue);
    } catch {
      throw new AppError('Payment not found', 404);
    }

    if (intent.metadata?.userId !== userId) {
      throw new AppError('Payment not found', 404);
    }

    if (intent.status === 'succeeded') {
      await this.fulfillPaymentIntent(intent);
    }

    const purchase = await Purchase.findOne({
      user: userId,
      stripePaymentIntentId: paymentIntentIdValue,
    });

    if (!purchase) {
      throw new AppError('Payment not found', 404);
    }

    const book = await Book.findById(purchase.book);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return {
      purchase,
      book,
      alreadyOwned: purchase.status === 'completed',
      clientSecret: null,
      publishableKey: null,
      paymentIntentId: intent.id,
    };
  }

  static async fulfillPaymentIntent(intent: Stripe.PaymentIntent) {
    const purchaseId = intent.metadata?.purchaseId;
    if (!purchaseId) {
      return;
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return;
    }

    if (intent.metadata?.userId && purchase.user.toString() !== intent.metadata.userId) {
      return;
    }

    if (intent.metadata?.bookId && purchase.book.toString() !== intent.metadata.bookId) {
      return;
    }

    if (intent.status !== 'succeeded') {
      return;
    }

    if (purchase.status === 'completed' || purchase.status === 'refunded') {
      return;
    }

    purchase.status = 'completed';
    purchase.paymentMethod = 'stripe';
    purchase.amount = intent.amount_received
      ? intent.amount_received / 100
      : intent.amount / 100;
    purchase.currency = (intent.currency || purchase.currency).toUpperCase();
    purchase.stripePaymentIntentId = intent.id;
    purchase.purchasedAt = new Date();
    await purchase.save();
  }

  static async fulfillCheckoutSession(session: Stripe.Checkout.Session) {
    const purchaseId = session.metadata?.purchaseId || session.client_reference_id;
    if (!purchaseId) {
      return;
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return;
    }

    if (session.metadata?.userId && purchase.user.toString() !== session.metadata.userId) {
      return;
    }

    if (session.metadata?.bookId && purchase.book.toString() !== session.metadata.bookId) {
      return;
    }

    if (session.payment_status !== 'paid') {
      return;
    }

    if (purchase.status === 'completed' || purchase.status === 'refunded') {
      return;
    }

    purchase.status = 'completed';
    purchase.paymentMethod = 'stripe';
    purchase.amount =
      typeof session.amount_total === 'number' ? session.amount_total / 100 : purchase.amount;
    purchase.currency = (session.currency || purchase.currency).toUpperCase();
    purchase.stripeCheckoutSessionId = session.id;
    purchase.stripePaymentIntentId = paymentIntentId(session);
    purchase.purchasedAt = new Date();
    await purchase.save();
  }

  /**
   * Asks Stripe whether this Checkout Session was paid, then records the sale.
   * Used by the success redirect and by the app when the reader returns.
   */
  static async recordPaidCheckout(sessionId: string): Promise<'paid' | 'unpaid' | 'missing'> {
    const trimmed = sessionId.trim();
    if (!trimmed) {
      return 'missing';
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await getStripe().checkout.sessions.retrieve(trimmed);
    } catch {
      return 'missing';
    }

    if (session.payment_status !== 'paid') {
      return 'unpaid';
    }

    await this.fulfillCheckoutSession(session);
    return 'paid';
  }

  static async salesReport(): Promise<SalesReport> {
    const [completedCount, refundedCount, pendingCount, byCurrency, byBook, recent] =
      await Promise.all([
        Purchase.countDocuments({ status: 'completed', paymentMethod: 'stripe' }),
        Purchase.countDocuments({ status: 'refunded' }),
        Purchase.countDocuments({ status: 'pending' }),
        Purchase.aggregate<{ _id: string; grossRevenue: number; saleCount: number }>([
          { $match: { status: 'completed', paymentMethod: 'stripe' } },
          {
            $group: {
              _id: '$currency',
              grossRevenue: { $sum: '$amount' },
              saleCount: { $sum: 1 },
            },
          },
          { $sort: { grossRevenue: -1 } },
        ]),
        Purchase.aggregate<{
          _id: { book: unknown; currency: string };
          saleCount: number;
          grossRevenue: number;
          book: Array<{ title?: string }>;
        }>([
          { $match: { status: 'completed', paymentMethod: 'stripe' } },
          {
            $group: {
              _id: { book: '$book', currency: '$currency' },
              saleCount: { $sum: 1 },
              grossRevenue: { $sum: '$amount' },
            },
          },
          {
            $lookup: {
              from: 'books',
              localField: '_id.book',
              foreignField: '_id',
              as: 'book',
            },
          },
          { $sort: { grossRevenue: -1 } },
        ]),
        Purchase.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('book', 'title')
          .populate('user', 'name email'),
      ]);

    return {
      completedCount,
      refundedCount,
      pendingCount,
      byCurrency: byCurrency.map((row) => ({
        currency: row._id || 'USD',
        grossRevenue: row.grossRevenue,
        saleCount: row.saleCount,
      })),
      byBook: byBook.map((row) => ({
        bookId: readId(row._id.book),
        title: row.book[0]?.title || 'Removed book',
        currency: row._id.currency || 'USD',
        saleCount: row.saleCount,
        grossRevenue: row.grossRevenue,
      })),
      recent: recent.map((purchase) => ({
        id: purchase.id,
        bookId: readId(purchase.book),
        bookTitle: readField(purchase.book, 'title') || 'Removed book',
        userName: readField(purchase.user, 'name') || 'Unknown',
        userEmail: readField(purchase.user, 'email'),
        amount: purchase.amount,
        currency: purchase.currency,
        paymentMethod: purchase.paymentMethod,
        status: purchase.status,
        purchasedAt: purchase.purchasedAt,
        createdAt: purchase.createdAt,
      })),
    };
  }

  static async removeForBook(bookId: string) {
    await Purchase.deleteMany({ book: bookId });
  }

  private static async grantFree(userId: string, book: IBook): Promise<CheckoutResult> {
    const existing = await Purchase.findOne({
      user: userId,
      book: book._id,
      status: 'completed',
    });

    if (existing) {
      return {
        purchase: existing,
        book,
      alreadyOwned: true,
      clientSecret: null,
      publishableKey: null,
      paymentIntentId: null,
    };
  }

    const purchase = await Purchase.findOneAndUpdate(
      { user: userId, book: book._id },
      {
        user: userId,
        book: book._id,
        amount: 0,
        currency: book.currency || 'USD',
        paymentMethod: 'simple',
        status: 'completed',
        purchasedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (!purchase) {
      throw new AppError('Unable to record purchase', 500);
    }

    return {
      purchase,
      book,
      alreadyOwned: false,
      clientSecret: null,
      publishableKey: null,
      paymentIntentId: null,
    };
  }

  private static async findOrCreatePending(userId: string, book: IBook) {
    const existing = await Purchase.findOne({ user: userId, book: book._id });

    if (existing?.status === 'completed') {
      return existing;
    }

    if (existing) {
      existing.amount = book.price;
      existing.currency = book.currency || 'USD';
      existing.paymentMethod = 'stripe';
      existing.status = 'pending';
      await existing.save();
      return existing;
    }

    try {
      return await Purchase.create({
        user: userId,
        book: book._id,
        amount: book.price,
        currency: book.currency || 'USD',
        paymentMethod: 'stripe',
        status: 'pending',
        purchasedAt: new Date(),
      });
    } catch (error) {
      if (!isDuplicateKey(error)) {
        throw error;
      }

      const raced = await Purchase.findOne({ user: userId, book: book._id });
      if (!raced) {
        throw error;
      }

      if (raced.status !== 'completed') {
        raced.amount = book.price;
        raced.currency = book.currency || 'USD';
        raced.paymentMethod = 'stripe';
        raced.status = 'pending';
        await raced.save();
      }

      return raced;
    }
  }

  private static async reusablePaymentIntent(
    paymentIntentIdValue: string,
    amount: number,
    currency: string,
  ) {
    try {
      const intent = await getStripe().paymentIntents.retrieve(paymentIntentIdValue);
      const reusable =
        intent.status === 'requires_payment_method' ||
        intent.status === 'requires_confirmation' ||
        intent.status === 'requires_action';

      if (
        reusable &&
        intent.client_secret &&
        intent.amount === amount &&
        intent.currency === currency
      ) {
        return { id: intent.id, clientSecret: intent.client_secret };
      }
    } catch {
      return null;
    }

    return null;
  }
}
