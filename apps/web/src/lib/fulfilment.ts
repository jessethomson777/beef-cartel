/**
 * Fulfilment is pickup-only, from one location: Laine's cold room in Emerald.
 * PICKUP_REGION is shown publicly (catalogue/review). The full street address
 * (PICKUP_ADDRESS / PICKUP_NOTE) is only ever rendered post-purchase
 * (confirmation page + receipt email) and on the order record — keep it out of
 * client components so it stays out of the public bundle.
 */
export const PICKUP_REGION = 'Emerald, QLD';
export const PICKUP_ADDRESS = '234 Codenwarra Road, Emerald QLD 4720';
export const PICKUP_NOTE =
  "Pickup from Laine's cold room — 234 Codenwarra Road, Emerald QLD 4720. We'll email you when your order is ready to collect.";
