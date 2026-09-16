import { Document, Schema, Types, model } from 'mongoose';

export interface IBookReview extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  bookTitle: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookReviewSchema = new Schema<IBookReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

bookReviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });
bookReviewSchema.index({ bookId: 1, createdAt: -1 });
bookReviewSchema.index({ createdAt: -1 });

export const BookReview = model<IBookReview>('BookReview', bookReviewSchema);
