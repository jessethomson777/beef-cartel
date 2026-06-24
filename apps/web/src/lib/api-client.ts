import type { CustomerDetails } from './types';

export interface CreateIntentResult {
  clientSecret: string;
  orderId: string;
  depositAmount: number;
}

/** Start checkout: server recomputes the deposit and returns a PaymentIntent secret. */
export async function createDepositIntent(payload: {
  items: { productId: string; qty: number }[];
  customer: CustomerDetails;
  requestId?: string;
}): Promise<CreateIntentResult> {
  const res = await fetch('/api/checkout/create-intent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Could not start checkout.');
  return data as CreateIntentResult;
}
