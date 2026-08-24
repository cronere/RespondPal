import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// PATCH /api/admin/commission-events/[id] — Jacob manually resolves a
// needs_review row: assign the correct rep and/or client, and mark it
// reviewed. This is the only way a needs_review event ever becomes
// something the future commission calculation engine will count — nothing
// here auto-promotes itself to matched.
export async function PATCH(req, { params }) {
  try {
    const body = await req.json()
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
    return NextResponse.json({ event: data })
  } catch (err) {
    console.error('Commission event resolve error:', err)
    return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 })
  }
}
