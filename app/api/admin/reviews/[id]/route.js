import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const EDITABLE_FIELDS = [
  'reviewer_name',
  'star_rating',
  'recommendation',
  'review_text',
  'review_date',
  'response_draft',
  'response_final',
  'response_status',
  'needs_attention',
]

// PATCH /api/admin/reviews/[id] — update a review (draft, status, etc.)
export async function PATCH(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const updates = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) updates[key] = body[key]
    }

    // When marking posted, stamp the posted time automatically.
    if (updates.response_status === 'posted' && !('response_posted_at' in body)) {
      updates.response_posted_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select('*, clients(business_name, response_signer, response_tone, things_to_avoid, business_tagline, ai_instructions)')
      .single()

    if (error) {
      console.error('Review update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ review: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update review.' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews/[id] — remove a review from the queue.
export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete review.' }, { status: 500 })
  }
}
