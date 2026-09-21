import { Document, Schema, Types, model } from 'mongoose';

export interface IReflectionPromptTarget {
  bookId: Types.ObjectId;
  chapterId: Types.ObjectId;
}

export interface IReflectionPrompt extends Document {
  body: string;
  targets: IReflectionPromptTarget[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const reflectionPromptTargetSchema = new Schema<IReflectionPromptTarget>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false },
);

const reflectionPromptSchema = new Schema<IReflectionPrompt>(
  {
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    targets: {
      type: [reflectionPromptTargetSchema],
      required: true,
      validate: {
        validator(value: IReflectionPromptTarget[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one book/chapter target is required',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reflectionPromptSchema.index({
  'targets.bookId': 1,
  'targets.chapterId': 1,
  isActive: 1,
  order: 1,
});

export const ReflectionPrompt = model<IReflectionPrompt>(
  'ReflectionPrompt',
  reflectionPromptSchema,
);
