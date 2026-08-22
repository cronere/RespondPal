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
  'commission_months_completed',
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

    // Ownership rule groundwork: when a client transitions INTO cancelled,
    // stamp cancelled_at (starts the 90-day first-right-of-return clock)
    // and — unless the admin form already sent an explicit value for it —
    // fill commission_months_completed with a reasonable starting estimate
    // (whole months from live_date to now). This is an approximation, not
    // an authoritative calculation — it doesn't account for paused periods
    // in between, since that level of tracking is part of the full
    // commission tracker being built later. Jacob can manually correct
    // this number before it's relied on for an actual payout resumption.
    if (updates.status === 'cancelled') {
      const { data: current } = await supabaseAdmin
        .from('clients')
        .select('status, live_date')
        .eq('id', id)
        .single()

      if (current && current.status !== 'cancelled') {
        updates.cancelled_at = new Date().toISOString()
        if (current.live_date && updates.commission_months_completed === undefined) {
          const months = Math.max(
            0,
            Math.floor((Date.now() - new Date(current.live_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
          )
          updates.commission_months_completed = months
        }
      }
    }
    // Reactivating from cancelled clears the cancelled_at stamp — that
    // cancellation period is resolved once they're active again.
    if (updates.status && updates.status !== 'cancelled') {
      updates.cancelled_at = null
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
