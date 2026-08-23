import Stripe from 'stripe'

// Shared Stripe client. Returns null (rather than throwing) when
// STRIPE_SECRET_KEY isn't set, so callers can degrade gracefully — e.g.
// rep creation should still succeed even if Stripe isn't configured yet,
// the same way it already tolerates the welcome email failing to send.
export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

// Maps each pricing tier to its Stripe Price ID, read from environment
// variables — see .env.local.example for where these come from.
export const TIER_PRICE_IDS = {
  '1_location': process.env.STRIPE_PRICE_1_LOCATION,
  '2_locations': process.env.STRIPE_PRICE_2_LOCATIONS,
  '3_locations': process.env.STRIPE_PRICE_3_LOCATIONS,
  'cleanup': process.env.STRIPE_PRICE_CLEANUP,
}

export const TIER_LABELS = {
  '1_location': '1 Location',
  '2_locations': '2 Locations',
  '3_locations': '3 Locations',
  'cleanup': 'Cleanup add-on',
}
