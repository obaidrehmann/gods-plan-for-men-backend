import { Document, Schema, Types, model } from 'mongoose';

export type PaymentMethod = 'simple' | 'stripe';
export type PurchaseStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface IPurchase extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  /** Reserved for Stripe PaymentIntent id when Stripe is wired up. */
  stripePaymentIntentId?: string | null;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 3,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['simple', 'stripe'],
      default: 'simple',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
      trim: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

purchaseSchema.index({ user: 1, book: 1 }, { unique: true });

export const Purchase = model<IPurchase>('Purchase', purchaseSchema);
