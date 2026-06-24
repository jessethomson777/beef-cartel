import { loadStripe, type Stripe } from '@stripe/stripe-js';

/** Singleton Stripe.js loader for the browser (Payment Element). */
let promise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!promise) {
    promise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return promise;
}
