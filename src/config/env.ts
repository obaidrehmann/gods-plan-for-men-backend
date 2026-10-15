import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  PUBLIC_BASE_URL: z.string().url().default('http://127.0.0.1:3000'),
  /** Secret key (sk_test_... or sk_live_...). Empty disables paid checkout. */
  STRIPE_SECRET_KEY: z.string().default(''),
  /** Publishable key (pk_test_... or pk_live_...). Required for the in-app card sheet. */
  STRIPE_PUBLISHABLE_KEY: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
