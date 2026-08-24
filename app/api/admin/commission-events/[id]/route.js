import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { calculateAndRecordCommission } from '../../../../lib/commissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// PATCH /api/admin/commission-events/[id] — Jacob manually resolves a
// needs_review row: assign the correct rep and/or client, and mark it
// reviewed. This is the only way a needs_review event ever becomes
// something the commission calculation engine will count — nothing here
// auto-promotes itself to matched. If a client is now assigned (and this
// is a payment event that hasn't been calculated yet), calculation runs
// immediately, same as it would have if the webhook had matched it
// automatically in the first place.
// PATCH /api/admin/commission-events/[id] — two distinct things happen
// here, depending on what's in the request body:
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
export async function PATCH(req, { params }) {
  try {
    const body = await req.json()

    if (body.commission_amount_cents !== undefined) {
      if (!body.adjustment_note || !body.adjustment_note.trim()) {
        return NextResponse.json({ error: 'A note explaining the correction is required.' }, { status: 400 })
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
