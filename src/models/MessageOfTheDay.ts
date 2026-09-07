import { Document, Schema, model } from 'mongoose';

export interface IMessageOfTheDay extends Document {
  body: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const messageOfTheDaySchema = new Schema<IMessageOfTheDay>(
  {
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
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

messageOfTheDaySchema.index({ isActive: 1, order: 1, createdAt: -1 });

export const MessageOfTheDay = model<IMessageOfTheDay>(
  'MessageOfTheDay',
  messageOfTheDaySchema,
);
