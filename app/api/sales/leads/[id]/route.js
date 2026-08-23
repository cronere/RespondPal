import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VALID_STAGES = ['lead', 'contacting', 'response_sent', 'won', 'lost']

// GET /api/sales/leads/[id] — single lead, for the detail page. Same
// ownership boundary as PATCH: viewable if the requesting rep owns it, or
// if it's currently unclaimed. A lead owned by a different rep returns
// 403 rather than leaking its details.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
    }
    if (data.sales_rep_id && data.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This lead belongs to another rep.' }, { status: 403 })
    }
    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load lead.' }, { status: 500 })
  }
}

// PATCH /api/sales/leads/[id] — update any editable field on a lead,
// including logging a contact.
//
// Ownership rule: a rep can update a lead if they already own it, OR if
// it's currently unclaimed (sales_rep_id is null) — taking real action on
// an unclaimed lead is what claims it, per the 90-day ownership policy.
// A lead still actively owned by a DIFFERENT rep is not touchable — the
// fetch-then-check below is the actual security boundary there.
export async function PATCH(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('leads')
      .select('id, sales_rep_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
    }
    if (existing.sales_rep_id && existing.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This lead belongs to another rep.' }, { status: 403 })
    }

    const body = await req.json()
    const updates = { updated_at: new Date().toISOString() }

    // Claiming: if it was unclaimed, this action makes the requesting rep
    // the new current owner. original_sales_rep_id is untouched — it
    // stays whoever found it first, forever.
    if (!existing.sales_rep_id) {
      updates.sales_rep_id = repId
    }

    if (body.stage !== undefined) {
      if (!VALID_STAGES.includes(body.stage)) {
        return NextResponse.json({ error: 'Invalid stage.' }, { status: 400 })
      }
      updates.stage = body.stage
    }
    if (body.business_name !== undefined) updates.business_name = body.business_name
    if (body.industry !== undefined) updates.industry = body.industry
    if (body.google_url !== undefined) updates.google_url = body.google_url
    if (body.yelp_url !== undefined) updates.yelp_url = body.yelp_url
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.contact_name !== undefined) updates.contact_name = body.contact_name
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email
    if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone

    // logContact: true is a distinct signal from "any field changed" —
    // deliberately set by the rep via a "Log Contact" action, not implied
    // by editing an unrelated field like notes.
    if (body.logContact === true) {
      updates.last_contacted_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !data) {
      console.error('Lead update error:', error)
      return NextResponse.json({ error: error?.message || 'Failed to update lead.' }, { status: 500 })
    }
    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update lead.' }, { status: 500 })
  }
}
