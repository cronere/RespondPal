import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { checkEditedDraft } from '../../../../lib/aiDrafting'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EDITABLE_FIELDS = [
  'business_name', 'industry', 'contact_name', 'contact_email',
  'google_url', 'yelp_url', 'total_reviews', 'response_rate',
  'reviews', 'status',
]

export async function GET(req, { params }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Response demo not found.' }, { status: 404 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load response demo.' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json()
    const update = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key]
    }
    update.updated_at = new Date().toISOString()

    // Same re-check the sales-side route does: when the caller identifies
    // which review was just hand-edited, re-run the compliance/
    // fault-concession checks on the new text server-side rather than
    // trusting whatever complianceFlag was sent — a human edit doesn't
    // mean the text is automatically clean, it means it now gets the same
    // scrutiny a fresh AI draft already gets. Not run for plain
    // deletes/adds/regenerates, which don't send editedIndex.
    if (Array.isArray(update.reviews) && Number.isInteger(body.editedIndex) && update.reviews[body.editedIndex]?.draft_response) {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (apiKey) {
        const { data: existing } = await supabaseAdmin
          .from('response_demos')
          .select('industry')
          .eq('id', params.id)
          .single()
        const target = update.reviews[body.editedIndex]
        const complianceFlag = await checkEditedDraft({
          draft: target.draft_response,
          reviewText: target.review_text,
          industry: update.industry ?? existing?.industry,
          apiKey,
        })
        update.reviews = update.reviews.map((r, i) => i === body.editedIndex ? { ...r, complianceFlag } : r)
      }
    }

    const { data, error } = await supabaseAdmin
      .from('response_demos')
      .update(update)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Response demo update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update response demo.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { error } = await supabaseAdmin
      .from('response_demos')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete response demo.' }, { status: 500 })
  }
}
