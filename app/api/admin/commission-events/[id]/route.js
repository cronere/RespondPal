import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { calculateAndRecordCommission } from '../../../../lib/commissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// PATCH /api/admin/commission-events/[id] — three distinct things can
// happen here, depending on what's in the request body:
//
// 1. Resolving a needs_review row: assign the correct rep and/or client,
//    mark it reviewed. If this is a payment event that hasn't been
//    calculated yet, calculation runs immediately afterward.
//
// 2. Manually correcting an ALREADY-calculated commission (wrong amount,
//    wrong rate, anything) — triggered when commission_amount_cents is
//    explicitly present in the body. The calculation engine deliberately
//    refuses to recalculate an event that already has a commission_month
//    set, so this is the only path to fix a mistake after the fact. A
//    note is required — this directly overrides a dollar amount, so there
//    needs to be a real audit trail of why.
//
// 3. Resolving a rep-initiated dispute — triggered when resolveDispute is
//    true in the body. Just clears the disputed flag; dispute_note and
//    disputed_at stay as a historical record of what was raised. If the
//    dispute was valid, use mode 2 above (in a separate request) to
//    actually correct the amount — this mode only marks it as handled.
export async function PATCH(req, { params }) {
  try {
    const body = await req.json()

    if (body.resolveDispute === true) {
      const { data, error } = await supabaseAdmin
        .from('commission_events')
        .update({ disputed: false })
        .eq('id', params.id)
        .select('*, sales_reps(name), clients(business_name)')
        .single()

      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Event not found.' }, { status: 404 })
      }
      return NextResponse.json({ event: data })
    }

    if (body.commission_amount_cents !== undefined) {
      if (!body.adjustment_note || !body.adjustment_note.trim()) {
        return NextResponse.json({ error: 'A note explaining the correction is required.' }, { status: 400 })
      }

      // Locking check: an approved or paid period is frozen. Fetch the
      // event's own period/rep first so we know exactly which
      // payout_periods row to check against.
      const { data: existingEvent } = await supabaseAdmin
        .from('commission_events')
        .select('payout_period_start, sales_rep_id')
        .eq('id', params.id)
        .single()

      if (existingEvent?.payout_period_start && existingEvent?.sales_rep_id) {
        const { data: period } = await supabaseAdmin
          .from('payout_periods')
          .select('status')
          .eq('period_start', existingEvent.payout_period_start)
          .eq('sales_rep_id', existingEvent.sales_rep_id)
          .single()

        if (period?.status === 'paid') {
          return NextResponse.json({ error: 'This period has already been paid and is locked permanently. Add a manual adjustment against a different period instead, with a note explaining why.' }, { status: 400 })
        }
        if (period?.status === 'approved') {
          return NextResponse.json({ error: 'This period is approved and locked. Unlock it from the Payout Periods tab first, make the correction, then re-approve.' }, { status: 400 })
        }
      }

      const { data, error } = await supabaseAdmin
        .from('commission_events')
        .update({
          commission_amount_cents: body.commission_amount_cents,
          adjusted: true,
          adjusted_at: new Date().toISOString(),
          adjustment_note: body.adjustment_note.trim(),
        })
        .eq('id', params.id)
        .select('*, sales_reps(name), clients(business_name)')
        .single()

      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Event not found.' }, { status: 404 })
      }
      return NextResponse.json({ event: data })
    }

    const updates = { status: 'reviewed' }
    if (body.sales_rep_id !== undefined) updates.sales_rep_id = body.sales_rep_id || null
    if (body.client_id !== undefined) updates.client_id = body.client_id || null
    if (body.review_note !== undefined) updates.review_note = body.review_note

    const { data, error } = await supabaseAdmin
      .from('commission_events')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Event not found.' }, { status: 404 })
    }

    let finalEvent = data
    if (data.event_type === 'payment' && data.client_id && data.commission_month == null) {
      const result = await calculateAndRecordCommission(supabaseAdmin, data.id)
      if (result.error) {
        console.error('Commission calculation failed after manual resolve:', result.error)
      } else {
        // Re-fetch so the response reflects the calculated values
        // immediately, rather than the admin UI needing a separate reload
        // to see the commission amount.
        const { data: refreshed } = await supabaseAdmin
          .from('commission_events')
          .select('*, sales_reps(name), clients(business_name)')
          .eq('id', data.id)
          .single()
        if (refreshed) finalEvent = refreshed
      }
    }

    return NextResponse.json({ event: finalEvent })
  } catch (err) {
    console.error('Commission event resolve error:', err)
    return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 })
  }
}
