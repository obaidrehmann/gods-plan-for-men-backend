import { Document, Schema, Types, model } from 'mongoose';

export interface IChapter {
  _id: Types.ObjectId;
  number: string;
  title: string;
  /** Display length for audio chapters (e.g. "16:24"). Optional for text-only. */
  duration: string;
  /** Optional audio file path for audio / both books. */
  audioUrl?: string;
  /** Optional chapter artwork shown in player / reflections. */
  imageUrl?: string;
  /** Typed chapter body for readable / both books. */
  textContent?: string;
  order: number;
}

export type BookMediaType = 'readable' | 'audio' | 'both';

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  shortBlurb?: string;
  coverUrl?: string;
  /** Optional full-book PDF for readable / both books. */
  pdfUrl?: string;
  /** Price in major currency units (e.g. 19.99). Stored for Stripe-ready checkout later. */
  price: number;
  currency: string;
  /** How the book can be consumed in the app. */
  mediaType: BookMediaType;
  isPublished: boolean;
  isFeatured: boolean;
  chapters: Types.DocumentArray<IChapter>;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    number: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    duration: {
      type: String,
      default: '',
      trim: true,
      maxlength: 20,
    },
    audioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    textContent: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: true },
);

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortBlurb: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    coverUrl: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    mediaType: {
      type: String,
      enum: ['readable', 'audio', 'both'],
      default: 'both',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    chapters: {
      type: [chapterSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ isFeatured: 1 });
bookSchema.index({ isPublished: 1 });

export const Book = model<IBook>('Book', bookSchema);
