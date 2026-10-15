import Stripe from 'stripe';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return env.STRIPE_SECRET_KEY.length > 0;
}

export function getPublishableKey(): string {
  if (!env.STRIPE_PUBLISHABLE_KEY) {
    throw new AppError(
      'Stripe publishable key is not configured. Add STRIPE_PUBLISHABLE_KEY to the server environment.',
      503,
      undefined,
      'STRIPE_NOT_CONFIGURED',
    );
  }

  return env.STRIPE_PUBLISHABLE_KEY;
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(
      'Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.',
      503,
      undefined,
      'STRIPE_NOT_CONFIGURED',
    );
  }

  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return client;
}

/** Stripe expects the smallest currency unit (cents for USD). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function checkoutReturnUrl(): string {
  return `${env.PUBLIC_BASE_URL}/api/v1/purchases/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
}

export function checkoutCancelUrl(): string {
  return `${env.PUBLIC_BASE_URL}/api/v1/purchases/checkout/cancel`;
}

export function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  if (!session.payment_intent) {
    return null;
  }

  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent.id;
}
