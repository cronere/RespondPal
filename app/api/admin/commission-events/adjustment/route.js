import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getPayoutPeriod } from '../../../../lib/commissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/commission-events/adjustment — a manual line item not
// tied to any real Stripe payment: a correction, a one-off bonus, a
// manually-applied clawback, anything Jacob needs to add directly. Reuses
// the same commission_events table and the same getPayoutPeriod logic as
// real payments, so an adjustment flows into the exact same payout-period
// grouping and approval workflow rather than needing separate handling
// anywhere downstream.
export async function POST(req) {
  try {
    const { sales_rep_id, client_id, amount_cents, effective_date, note } = await req.json()

    if (!sales_rep_id) {
      return NextResponse.json({ error: 'A sales rep is required.' }, { status: 400 })
    }
    if (amount_cents === undefined || amount_cents === null || amount_cents === 0) {
      return NextResponse.json({ error: 'A non-zero amount is required (negative is fine, for a deduction).' }, { status: 400 })
    }
    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'A note explaining this adjustment is required.' }, { status: 400 })
    }

    const dateForPeriod = effective_date ? new Date(effective_date) : new Date()
    const payoutPeriod = getPayoutPeriod(dateForPeriod.toISOString())

    // Locking check: reject an adjustment landing in an already-approved
    // or already-paid period for this rep — same rule as Correct Amount.
    // The error message tells Jacob exactly what to do differently rather
    // than just failing silently on a date he might not have thought
    // twice about.
    const { data: existingPeriod } = await supabaseAdmin
      .from('payout_periods')
      .select('status')
      .eq('period_start', payoutPeriod.payout_period_start)
      .eq('sales_rep_id', sales_rep_id)
      .single()

    if (existingPeriod?.status === 'paid') {
      return NextResponse.json({ error: `The period this date falls into (${payoutPeriod.payout_period_start} to ${payoutPeriod.payout_period_end}) has already been paid and is locked permanently. Choose a date in a different, unlocked period instead.` }, { status: 400 })
    }
    if (existingPeriod?.status === 'approved') {
      return NextResponse.json({ error: `The period this date falls into (${payoutPeriod.payout_period_start} to ${payoutPeriod.payout_period_end}) is approved and locked. Unlock it from the Payout Periods tab first, or choose a date in a different period.` }, { status: 400 })
    }

    // Adjustments have no underlying Stripe payment to apply a rate to —
    // the amount entered IS the commission, at 100%, with no tenure month
    // (that concept doesn't apply to a manual line item).
    const { data, error } = await supabaseAdmin
      .from('commission_events')
      .insert({
        stripe_event_id: `manual_${randomUUID()}`, // satisfies the unique/not-null constraint without implying a real Stripe event
        event_type: 'adjustment',
        sales_rep_id,
        client_id: client_id || null,
        amount_cents,
        commission_amount_cents: amount_cents,
        commission_rate: 1.00,
        status: 'reviewed',
        match_method: null,
        review_note: note.trim(),
        adjusted: true,
        adjusted_at: new Date().toISOString(),
        adjustment_note: note.trim(),
        payout_period_start: payoutPeriod.payout_period_start,
        payout_period_end: payoutPeriod.payout_period_end,
        payout_date: payoutPeriod.payout_date,
      })
      .select('*, sales_reps(name), clients(business_name)')
      .single()

    if (error) {
      console.error('Manual adjustment create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ event: data })
  } catch (err) {
    console.error('Manual adjustment error:', err)
    return NextResponse.json({ error: 'Failed to create adjustment.' }, { status: 500 })
  }
}
