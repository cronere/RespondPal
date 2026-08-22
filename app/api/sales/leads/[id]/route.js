import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VALID_STAGES = ['lead', 'contacting', 'response_sent', 'won', 'lost']

// PATCH /api/sales/leads/[id] — update stage and/or notes on a lead. The
// .eq('sales_rep_id', repId) below is the actual security boundary: even
// if a rep somehow guessed another rep's lead id, this update would match
// zero rows rather than touching someone else's data.
export async function PATCH(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    const updates = { updated_at: new Date().toISOString() }

    if (body.stage !== undefined) {
      if (!VALID_STAGES.includes(body.stage)) {
        return NextResponse.json({ error: 'Invalid stage.' }, { status: 400 })
      }
      updates.stage = body.stage
    }
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.contact_name !== undefined) updates.contact_name = body.contact_name
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email
    if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', params.id)
      .eq('sales_rep_id', repId)
      .select()
      .single()

    if (error) {
      console.error('Lead update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
    }
    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update lead.' }, { status: 500 })
  }
}
