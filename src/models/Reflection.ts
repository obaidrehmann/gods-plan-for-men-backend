import { Document, Schema, Types, model } from 'mongoose';

export type ReflectionStatus = 'private' | 'submitted';

export interface IReflection extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  chapterId: Types.ObjectId;
  title: string;
  body: string;
  status: ReflectionStatus;
  submittedAt?: Date | null;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const reflectionSchema = new Schema<IReflection>(
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
    chapterId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['private', 'submitted'],
      default: 'private',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    chapterTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    chapterNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
  },
  {
    timestamps: true,
  },
);

reflectionSchema.index({ userId: 1, createdAt: -1 });
reflectionSchema.index({ status: 1, submittedAt: -1 });

export const Reflection = model<IReflection>('Reflection', reflectionSchema);
