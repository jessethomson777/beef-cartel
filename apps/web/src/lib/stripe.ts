import 'server-only';
import Stripe from 'stripe';

/** Server-side Stripe client, lazily initialised (build never needs the key). */
let _stripe: Stripe | undefined;

export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  // No apiVersion pin → uses the account's default; upgrade deliberately later.
  _stripe = new Stripe(key);
  return _stripe;
}
