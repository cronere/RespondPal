import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const EDITABLE_FIELDS = [
  'business_name',
  'contact_name',
  'contact_email',
  'contact_phone',
  'industry',
  'raw_input',
  'status',
  'findings',
  'summary',
  'promo_code',
  'price_paid',
  'converted_client_id',
  'internal_notes',
  'total_reviews',
  'reviews_with_text',
  'reviews_with_responses',
  'response_rate_text',
  'response_rate_all',
  'avg_star_rating',
  'google_url',
  'negative_unresponded',
  'yelp_total_reviews',
  'yelp_reviews_with_text',
  'yelp_reviews_with_responses',
  'yelp_response_rate_text',
  'yelp_response_rate_all',
  'yelp_avg_star_rating',
  'yelp_url',
  'yelp_negative_unresponded',
]

// PATCH /api/admin/audits/[id] — update an audit record.
export async function PATCH(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const updates = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.status === 'delivered' && !('delivered_at' in body)) {
      updates.delivered_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('audits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Audit update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ audit: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update audit.' }, { status: 500 })
  }
}

// DELETE /api/admin/audits/[id] — remove an audit lead.
export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const { error } = await supabaseAdmin.from('audits').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete audit.' }, { status: 500 })
  }
}
