// Commission calculation engine.
//
// Design principle: every calculated value gets written permanently onto
// the commission_events row at the moment it's calculated, and never
// recomputed afterward. If the tier structure in Exhibit A changes later,
// past commissions stay exactly as they were actually calculated and paid
// — only new events use the new rates. This matches Section 3.1 of the
// rep agreement (tier changes are prospective, not retroactive).

// The tier structure — kept here as the single source of truth for the
// calculation engine. Mirrors what's documented in the Sales Toolkit's
// Commission tab; if that structure ever changes, update both places.
export function getCommissionRate(month) {
  if (month === 1) return 1.00
  if (month === 2) return 0.75
  if (month === 3) return 0.50
  if (month >= 4 && month <= 12) return 0.25
  if (month >= 13 && month <= 24) return 0.15
  return 0.10 // month 25+
}

// Given the date a payment cleared, returns which semi-monthly payout
// window it falls into and when that payout is actually issued — the
// exact schedule from Section 3.3 of the rep agreement:
//   1st-15th clears  -> included in the payout issued the 20th (same month)
//   16th-end clears  -> included in the payout issued the 5th (following month)
//
// NOTE on timezone: this uses the UTC calendar day of the input date,
// since that's simple and unambiguous with no extra library needed. In
// practice this means a payment clearing very late at night in Arizona
// time, right at a period boundary, could occasionally be assigned to a
// different day than if Arizona local time were used instead. This is a
// real policy choice, not just an implementation detail — flagging it as
// worth confirming rather than silently deciding it's fine.
export function getPayoutPeriod(clearedDate) {
  const d = new Date(clearedDate)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() // 0-indexed
  const day = d.getUTCDate()

  if (day <= 15) {
    const periodStart = new Date(Date.UTC(year, month, 1))
    const periodEnd = new Date(Date.UTC(year, month, 15))
    const payoutDate = new Date(Date.UTC(year, month, 20))
    return { payout_period_start: toISODate(periodStart), payout_period_end: toISODate(periodEnd), payout_date: toISODate(payoutDate) }
  } else {
    const periodStart = new Date(Date.UTC(year, month, 16))
    // Last day of the current month
    const periodEnd = new Date(Date.UTC(year, month + 1, 0))
    // 5th of the following month
    const payoutDate = new Date(Date.UTC(year, month + 1, 5))
    return { payout_period_start: toISODate(periodStart), payout_period_end: toISODate(periodEnd), payout_date: toISODate(payoutDate) }
  }
}

function toISODate(d) {
  return d.toISOString().split('T')[0]
}

// The main entry point. Called from exactly two places: the webhook,
// right after a payment auto-matches with high confidence, and the admin
// resolve endpoint, right after Jacob manually reviews and confirms a
// match. Both funnel through this same function so there's one
// calculation path, not two that could drift apart.
//
// Only ever operates on 'payment' events with a resolved client_id —
// chargebacks are never calculated here (they're a reversal, not a new
// commission-month), and an event with no client still attached isn't
// ready to be calculated no matter its status.
export async function calculateAndRecordCommission(supabase, commissionEventId) {
  const { data: event, error: fetchError } = await supabase
    .from('commission_events')
    .select('*')
    .eq('id', commissionEventId)
    .single()

  if (fetchError || !event) {
    console.error('calculateAndRecordCommission: event not found', commissionEventId)
    return { error: 'Event not found.' }
  }
  if (event.event_type !== 'payment') {
    return { error: 'Only payment events are calculated — chargebacks are handled separately.' }
  }
  if (!event.client_id) {
    return { error: 'Event has no client assigned yet — cannot calculate.' }
  }
  if (event.commission_month != null) {
    // Already calculated — never recalculate an existing record.
    return { alreadyCalculated: true }
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, commission_months_completed')
    .eq('id', event.client_id)
    .single()

  if (clientError || !client) {
    console.error('calculateAndRecordCommission: client not found', event.client_id)
    return { error: 'Client not found.' }
  }

  const newMonth = (client.commission_months_completed || 0) + 1
  const rate = getCommissionRate(newMonth)
  const commissionAmountCents = Math.round(event.amount_cents * rate)
  const payoutPeriod = getPayoutPeriod(event.created_at)

  const { error: updateEventError } = await supabase
    .from('commission_events')
    .update({
      commission_month: newMonth,
      commission_rate: rate,
      commission_amount_cents: commissionAmountCents,
      payout_period_start: payoutPeriod.payout_period_start,
      payout_period_end: payoutPeriod.payout_period_end,
      payout_date: payoutPeriod.payout_date,
    })
    .eq('id', commissionEventId)

  if (updateEventError) {
    console.error('calculateAndRecordCommission: failed to update event', updateEventError)
    return { error: 'Failed to record calculation.' }
  }

  const { error: updateClientError } = await supabase
    .from('clients')
    .update({ commission_months_completed: newMonth })
    .eq('id', client.id)

  if (updateClientError) {
    console.error('calculateAndRecordCommission: failed to advance client month counter', updateClientError)
    // The event itself is already recorded correctly — this is a real
    // problem (the client's counter is now out of sync) but shouldn't be
    // silently swallowed. Surfaced in the return value so a caller can log
    // or alert on it rather than assume everything succeeded.
    return { error: 'Commission recorded, but failed to advance client month counter — needs manual reconciliation.' }
  }

  return { commission_month: newMonth, commission_rate: rate, commission_amount_cents: commissionAmountCents }
}
