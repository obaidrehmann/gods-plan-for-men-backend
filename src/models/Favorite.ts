import { Document, Schema, Types, model } from 'mongoose';

export interface IFavorite extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
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
  },
  {
    timestamps: true,
  },
);

favoriteSchema.index({ user: 1, book: 1 }, { unique: true });

export const Favorite = model<IFavorite>('Favorite', favoriteSchema);
