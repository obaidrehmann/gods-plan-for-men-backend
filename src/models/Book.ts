import { Document, Schema, model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    coverUrl: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ title: 'text', author: 'text', description: 'text' });

export const Book = model<IBook>('Book', bookSchema);
