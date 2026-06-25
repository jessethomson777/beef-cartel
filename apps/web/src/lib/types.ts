/**
 * Shared domain types. Money is in AUD DOLLARS (numbers) everywhere in the app
 * and in Firestore — human-friendly for hand-editing docs. Conversion to Stripe
 * cents happens server-side at the Stripe boundary only (see lib/money.ts).
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Human cut summary, e.g. "Whole strip loin". */
  cuts: string;
  /** MSA marbling grade label, e.g. "MSA 7", "9+". */
  grade: string;
  weightMinKg: number;
  weightMaxKg: number;
  /**
   * PRICE PER KG (AUD) — the single source of truth for pricing. Edit this to
   * change a cut's price. `estTotalAmount` and `depositAmount` are DERIVED from
   * it × the weight range (see lib/money.ts `withDerivedPricing`).
   */
  pricePerKg: number;
  /** Deposit charged now (AUD dollars), derived = 30% of estTotalAmount. */
  depositAmount: number;
  /** Estimated box price (AUD dollars), derived = pricePerKg × midpoint weight. */
  estTotalAmount: number;
  imageUrl?: string;
  sort: number;
  active: boolean;
}

export type OrderCycleStatus = 'draft' | 'open' | 'closed' | 'dispatched';

export interface OrderCycle {
  id: string;
  name: string;
  /** ISO strings app-side; stored as Firestore Timestamps. */
  opensAt: string;
  closesAt: string;
  dispatchDate: string;
  status: OrderCycleStatus;
}

export type OrderStatus =
  | 'deposit_paid'
  | 'sent_to_supplier'
  | 'dispatched'
  | 'balance_charged'
  | 'balance_failed';

export interface OrderItem {
  productId: string;
  /** Denormalised for display + the supplier PO without extra reads. */
  name: string;
  qty: number;
  unitDeposit: number;
  estUnitTotal: number;
  /**
   * $/kg locked at order time — the rate the final balance is billed at, so a
   * later catalogue price change never affects an existing order.
   */
  pricePerKg: number;
  /** MSA grade label, e.g. "8/9" (denormalised for receipts/confirmation). */
  grade?: string;
  /** Weight range string, e.g. "1.2–1.5 kg". */
  weightRange?: string;
}

export interface Order {
  id: string;
  cycleId: string | null;
  customerName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string | null;
  depositAmount: number;
  depositPiId: string;
  balanceAmount: number | null;
  balancePiId: string | null;
  /** SCA fallback: a single-use Stripe link emailed when an off-session charge needs auth. */
  balancePaymentLink?: string | null;
  status: OrderStatus;
  /** Epoch milliseconds (serialisable to the client). */
  createdAt: number;
  items?: OrderItem[];
  /** Final billed price once weighed (AUD) = Σ(line $/kg × actual line kg). */
  finalTotalAmount?: number;
  /** Total actual weight entered at dispatch (kg). */
  finalWeightKg?: number;
  /** Actual weight entered per line item (productId → kg). */
  lineWeights?: Record<string, number>;
}

/** A box queued before payment confirms (staging; promoted to an Order by the webhook). */
export interface PendingOrder {
  orderId: string;
  cycleId: string | null;
  customerName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  stripeCustomerId: string;
  depositPiId: string;
  depositAmount: number;
  items: OrderItem[];
  createdAt: number;
}

/** Customer details collected on /review. Fulfilment is Emerald pickup (no address). */
export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

/** One catalogue line with quantity, joined with its product (client-side display). */
export interface CartLine {
  product: Product;
  qty: number;
}

/** Aggregated supplier purchase order for one cycle. */
export interface POLine {
  productId: string;
  name: string;
  grade: string;
  qty: number;
  estWeightKg: number;
}
export interface PurchaseOrder {
  cycleId: string | null;
  lines: POLine[];
  totalBoxes: number;
  totalEstWeightKg: number;
  orderCount: number;
}
