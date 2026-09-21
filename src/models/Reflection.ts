import { Document, Schema, Types, model } from 'mongoose';

export type ReflectionStatus = 'private' | 'submitted';
export type ReflectionMessageRole = 'admin' | 'user';

export interface IReflectionMessage {
  _id: Types.ObjectId;
  role: ReflectionMessageRole;
  body: string;
  authorId: Types.ObjectId;
  createdAt: Date;
}

export interface IReflection extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  chapterId: Types.ObjectId;
  title: string;
  body: string;
  status: ReflectionStatus;
  submittedAt?: Date | null;
  messages: Types.DocumentArray<IReflectionMessage>;
  /** @deprecated Prefer messages[]; kept for legacy documents */
  adminResponse?: string | null;
  /** @deprecated Prefer messages[]; kept for legacy documents */
  adminRespondedAt?: Date | null;
  /** @deprecated Prefer messages[]; kept for legacy documents */
  adminRespondedBy?: Types.ObjectId | null;
  userSeenAdminResponseAt?: Date | null;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: string;
  chapterImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const reflectionMessageSchema = new Schema<IReflectionMessage>(
  {
    role: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

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
    messages: {
      type: [reflectionMessageSchema],
      default: [],
    },
    adminResponse: {
      type: String,
      default: null,
      trim: true,
    },
    adminRespondedAt: {
      type: Date,
      default: null,
    },
    adminRespondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userSeenAdminResponseAt: {
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
    chapterImageUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

reflectionSchema.index({ userId: 1, createdAt: -1 });
reflectionSchema.index({ status: 1, submittedAt: -1 });

export const Reflection = model<IReflection>('Reflection', reflectionSchema);
