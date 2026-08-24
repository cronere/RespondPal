import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeClient } from '../../../lib/stripe'
import { calculateAndRecordCommission } from '../../../lib/commissions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'

// POST /api/webhooks/stripe — the actual foundation the whole commission
// system is built on. Every payment and chargeback that matters flows
// through here first.
//
// Deliberately conservative about matching: this only ever writes a
// 'matched' row when it's genuinely confident (rep_id came directly from
// Stripe metadata, or an email match resolved to exactly one rep by exact
// name). Anything less certain — no metadata, ambiguous name match, no
// client found at all — lands as 'needs_review' rather than guessing,
// per the explicit decision that unmatched payments never auto-count
// toward commission.
export async function POST(req) {
  const stripe = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    console.error('Stripe webhook received but STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set.')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })
  }

  // Signature verification requires the RAW request body — not JSON.parse'd
  // — which is why this reads .text() rather than .json(). This is the
  // actual security boundary: without it, anyone who found this URL could
  // POST a fake "payment succeeded" event and fraudulently trigger
  // commission credit.
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(stripe, event)
    } else if (event.type === 'invoice.paid') {
      await handleInvoicePaid(stripe, event)
    } else if (event.type === 'charge.dispute.created') {
      await handleChargeback(event)
    }
    // Any other event type: acknowledged, ignored. Stripe sends many event
    // types we don't care about — a 200 here just means "received," not
    // "processed as a commission event."
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook processing error:', err, 'Event:', event.id, event.type)
    // Non-200 tells Stripe to retry this event later — appropriate for a
    // genuine processing failure (e.g. a transient database error), since
    // we'd rather get a delayed retry than silently lose a real payment.
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 })
  }
}

// checkout.session.completed fires once, for the FIRST payment on a new
// subscription. Its only job here is to propagate the rep-attribution
// metadata (from the rep's personal payment link) onto the underlying
// Subscription object — so every FUTURE invoice.paid event for this
// subscription can read it directly, without needing to trace back to this
// original session. This does NOT record a commission_events row itself —
// that happens uniformly through invoice.paid instead, including for this
// first payment, so there's exactly one recording path and no risk of
// double-counting the first invoice.
async function handleCheckoutCompleted(stripe, event) {
  const session = event.data.object
  const repId = session.metadata?.sales_rep_id
  if (repId && session.subscription) {
    try {
      await stripe.subscriptions.update(session.subscription, {
        metadata: { sales_rep_id: repId, sales_rep_name: session.metadata?.sales_rep_name || '' },
      })
    } catch (err) {
      console.error('Failed to propagate rep metadata onto subscription:', err)
    }
  }
}

// invoice.paid fires for every cleared billing cycle, including the first
// — this is the single, consistent source for every recorded payment.
async function handleInvoicePaid(stripe, event) {
  const invoice = event.data.object

  // Already recorded? Stripe can redeliver the same event; the unique
  // constraint on stripe_event_id is the real guard, this is just an
  // early exit to avoid unnecessary API calls first.
  const { data: existing } = await supabase
    .from('commission_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()
  if (existing) return

  const amountCents = invoice.amount_paid
  const customerId = invoice.customer
  const subscriptionId = invoice.subscription || null
  const chargeId = invoice.charge || null

  let salesRepId = null
  let clientId = null
  let matchMethod = null
  let status = 'needs_review'
  let reviewNote = null

  // Path 1: rep metadata on the subscription (propagated during checkout,
  // see handleCheckoutCompleted). This is the reliable, intended path.
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (subscription.metadata?.sales_rep_id) {
        salesRepId = subscription.metadata.sales_rep_id
        matchMethod = 'metadata'
        status = 'matched'
      }
    } catch (err) {
      console.error('Failed to retrieve subscription for metadata lookup:', err)
    }
  }

  // Try to find the corresponding client record either way — useful even
  // on the metadata path, and required for the email-fallback path below.
  try {
    const customer = await stripe.customers.retrieve(customerId)
    const email = customer?.email
    if (email) {
      const { data: clientMatch } = await supabase
        .from('clients')
        .select('id, rep_name')
        .ilike('email', email)
        .maybeSingle()

      if (clientMatch) {
        clientId = clientMatch.id

        // Path 2 (fallback only, when metadata didn't already match):
        // resolve the client's rep_name to a sales_reps row by exact,
        // case-insensitive name match. Only auto-matches if that resolves
        // to exactly one rep — anything ambiguous stays in review rather
        // than guessing.
        if (!salesRepId && clientMatch.rep_name) {
          const { data: repMatches } = await supabase
            .from('sales_reps')
            .select('id')
            .ilike('name', clientMatch.rep_name.trim())
          if (repMatches && repMatches.length === 1) {
            salesRepId = repMatches[0].id
            matchMethod = 'email'
            status = 'matched'
          } else if (repMatches && repMatches.length > 1) {
            reviewNote = `Client's rep_name "${clientMatch.rep_name}" matched ${repMatches.length} sales reps — ambiguous, needs manual resolution.`
          } else {
            reviewNote = `Client's rep_name "${clientMatch.rep_name}" didn't match any sales rep by name.`
          }
        }
      } else if (!salesRepId) {
        reviewNote = `No client record found for customer email ${email}.`
      }
    } else if (!salesRepId) {
      reviewNote = 'Stripe customer has no email on file — could not attempt email matching.'
    }
  } catch (err) {
    console.error('Failed to retrieve customer for email matching:', err)
    if (!reviewNote) reviewNote = 'Error while attempting to look up the paying customer.'
  }

  const { data: insertedEvent, error: insertError } = await supabase
    .from('commission_events')
    .insert({
      stripe_event_id: event.id,
      event_type: 'payment',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_invoice_id: invoice.id,
      stripe_charge_id: chargeId,
      amount_cents: amountCents,
      match_method: matchMethod,
      sales_rep_id: salesRepId,
      client_id: clientId,
      status,
      review_note: reviewNote,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to insert commission event:', insertError)
    throw insertError // triggers the 500 response, so Stripe retries
  }

  // Only confidently auto-matched events get calculated immediately.
  // needs_review events wait until Jacob manually resolves them — see the
  // admin resolve endpoint, which triggers the same calculation function
  // once a client is actually assigned.
  if (status === 'matched' && insertedEvent) {
    const result = await calculateAndRecordCommission(supabase, insertedEvent.id)
    if (result.error) {
      console.error('Commission calculation failed for event', insertedEvent.id, result.error)
    }
  }
}

// charge.dispute.created fires when a client disputes a charge with their
// bank. Always lands as needs_review — the actual clawback timing logic
// (before vs. after the affected payout, per Section 3.4 of the rep
// agreement) depends on the payout-period engine, which isn't built yet.
// This just gets the event recorded and linked to its original payment so
// nothing is lost while that next phase gets built.
async function handleChargeback(event) {
  const dispute = event.data.object
  const chargeId = dispute.charge

  const { data: existing } = await supabase
    .from('commission_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()
  if (existing) return

  const { data: originalPayment } = await supabase
    .from('commission_events')
    .select('id, sales_rep_id, client_id')
    .eq('stripe_charge_id', chargeId)
    .eq('event_type', 'payment')
    .maybeSingle()

  const { error: insertError } = await supabase.from('commission_events').insert({
    stripe_event_id: event.id,
    event_type: 'chargeback',
    stripe_charge_id: chargeId,
    amount_cents: dispute.amount,
    sales_rep_id: originalPayment?.sales_rep_id || null,
    client_id: originalPayment?.client_id || null,
    reverses_event_id: originalPayment?.id || null,
    status: 'needs_review',
    review_note: originalPayment
      ? 'Chargeback — linked to its original payment automatically. Needs manual review to determine clawback timing.'
      : 'Chargeback — could not find a matching original payment automatically. Needs manual review.',
  })

  if (insertError) {
    console.error('Failed to insert chargeback event:', insertError)
    throw insertError
  }
}
