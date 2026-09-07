import { Document, Schema, Types, model } from 'mongoose';

export interface IChapter {
  _id: Types.ObjectId;
  number: string;
  title: string;
  duration: string;
  audioUrl: string;
  order: number;
}

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  shortBlurb?: string;
  coverUrl?: string;
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
      required: true,
      trim: true,
      maxlength: 20,
    },
    audioUrl: {
      type: String,
      required: true,
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
