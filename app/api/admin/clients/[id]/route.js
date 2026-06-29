import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// Fields the admin UI is allowed to update. Anything not in this list is
// ignored, so the UI can never corrupt system/computed columns.
const EDITABLE_FIELDS = [
  'owner_name',
  'business_name',
  'email',
  'phone',
  'plan',
  'monthly_rate',
  'status',
  'industry',
  'locations',
  'google_profile_email',
  'yelp_url',
  'response_signer',
  'response_tone',
  'things_to_avoid',
  'business_tagline',
  'ai_instructions',
  'google_access',
  'yelp_access',
  'live_date',
  'notes',
  'rep_name',
  'cleanup_status',
  'onboarding_checklist',
]

// GET /api/admin/clients/[id] — single client detail
export async function GET(req, { params }) {
  try {
    const { id } = params
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ client: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load client.' }, { status: 500 })
  }
}

// PATCH /api/admin/clients/[id] — update editable fields
export async function PATCH(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    // Keep only whitelisted fields
    const updates = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Client update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ client: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update client.' }, { status: 500 })
  }
}
