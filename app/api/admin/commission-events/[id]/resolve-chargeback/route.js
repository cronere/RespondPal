import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { getPayoutPeriod } from '../../../../../lib/commissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/commission-events/[id]/resolve-chargeback — the actual
// implementation of Section 3.4 of the rep agreement: a chargeback
// affecting a commission not yet paid out gets removed from that period
// before it's paid; a chargeback affecting an already-paid commission
// gets deducted from a future payout instead, since the original payout
// and its statement are permanent records that don't get edited after
// the fact.
//
// Deliberately reuses the same primitives already built and tested —
// zeroing out an amount works exactly like Correct Amount, and the
// forward deduction is created exactly like a Manual Adjustment — rather
// than inventing a third, parallel mechanism.
export async function POST(req, { params }) {
  try {
    const { data: chargeback, error: fetchError } = await supabaseAdmin
      .from('commission_events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !chargeback) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (chargeback.event_type !== 'chargeback') {
      return NextResponse.json({ error: 'This isn\'t a chargeback event.' }, { status: 400 })
    }
    if (!chargeback.reverses_event_id) {
      return NextResponse.json({ error: 'This chargeback couldn\'t be automatically linked to an original payment. Resolve it manually with a Manual Adjustment instead, referencing it in the note.' }, { status: 400 })
    }

    const { data: original, error: originalError } = await supabaseAdmin
      .from('commission_events')
      .select('id, sales_rep_id, client_id, payout_period_start, commission_amount_cents, clients(business_name)')
      .eq('id', chargeback.reverses_event_id)
      .single()

    if (originalError || !original) {
      return NextResponse.json({ error: 'The original payment this chargeback reverses could not be found.' }, { status: 404 })
    }

    const { data: period } = await supabaseAdmin
      .from('payout_periods')
      .select('status')
      .eq('period_start', original.payout_period_start)
      .eq('sales_rep_id', original.sales_rep_id)
      .single()

    const periodStatus = period?.status || 'pending'

    if (periodStatus === 'approved') {
      return NextResponse.json({
        error: 'This chargeback affects a payment in an approved-but-unpaid period. Unlock that period from the Payout Periods tab first, then resolve this chargeback again.',
      }, { status: 400 })
    }

    if (periodStatus === 'pending') {
      // Not yet paid out — the original commission is simply removed
      // before it's ever paid. Same mechanism as Correct Amount.
      const note = `Zeroed out due to a chargeback (event ${chargeback.id.slice(0, 8)}) — no commission owed for this payment per the collected-revenue basis of the agreement.`
      const { error: updateError } = await supabaseAdmin
        .from('commission_events')
        .update({
          commission_amount_cents: 0,
          adjusted: true,
          adjusted_at: new Date().toISOString(),
          adjustment_note: note,
        })
        .eq('id', original.id)

      if (updateError) {
        console.error('Resolve chargeback — failed to zero out original:', updateError)
        return NextResponse.json({ error: 'Failed to apply the correction.' }, { status: 500 })
      }
    } else if (periodStatus === 'paid') {
      // Already paid — the original payout and its statement are
      // permanent and don't get touched. Instead, a negative adjustment
      // lands in whatever period today's date falls into, deducting the
      // amount from a future payout.
      const payoutPeriod = getPayoutPeriod(new Date().toISOString())
      const note = `Deduction for a chargeback on a payment already paid out (${original.clients?.business_name || 'client'}, event ${chargeback.id.slice(0, 8)}) — the original payout and statement are unaffected; this reduces a future payout instead.`

      const { error: insertError } = await supabaseAdmin
        .from('commission_events')
        .insert({
          stripe_event_id: `chargeback_deduction_${randomUUID()}`,
          event_type: 'adjustment',
          sales_rep_id: original.sales_rep_id,
          client_id: original.client_id,
          amount_cents: -Math.abs(chargeback.amount_cents || original.commission_amount_cents || 0),
          commission_amount_cents: -Math.abs(chargeback.amount_cents || original.commission_amount_cents || 0),
          commission_rate: 1.00,
          status: 'reviewed',
          review_note: note,
          adjusted: true,
          adjusted_at: new Date().toISOString(),
          adjustment_note: note,
          payout_period_start: payoutPeriod.payout_period_start,
          payout_period_end: payoutPeriod.payout_period_end,
          payout_date: payoutPeriod.payout_date,
        })

      if (insertError) {
        console.error('Resolve chargeback — failed to create deduction:', insertError)
        return NextResponse.json({ error: 'Failed to create the deduction.' }, { status: 500 })
      }
    }

    const { data: resolvedChargeback, error: resolveError } = await supabaseAdmin
      .from('commission_events')
      .update({ status: 'reviewed' })
      .eq('id', chargeback.id)
      .select('*, sales_reps(name), clients(business_name)')
      .single()

    if (resolveError) {
      console.error('Resolve chargeback — failed to mark reviewed:', resolveError)
      return NextResponse.json({ error: 'Correction was applied, but failed to mark the chargeback reviewed.' }, { status: 500 })
    }

    return NextResponse.json({ event: resolvedChargeback, appliedTo: periodStatus })
  } catch (err) {
    console.error('Resolve chargeback error:', err)
    return NextResponse.json({ error: 'Failed to resolve chargeback.' }, { status: 500 })
  }
}
