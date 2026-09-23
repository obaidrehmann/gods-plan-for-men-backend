import mongoose from 'mongoose';
import { env } from './env';
import { Purchase } from '../models/Purchase';
import { Favorite } from '../models/Favorite';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI);

  console.log('MongoDB connected');

  // Keep collection indexes aligned with current schemas (drops stale unique indexes).
  if (env.NODE_ENV !== 'production') {
    await Promise.all([Purchase.syncIndexes(), Favorite.syncIndexes()]);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
