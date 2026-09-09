import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'
import { checkEditedDraft } from '../../../../lib/aiDrafting'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/response-examples/[id] — single demo. Ownership boundary:
// only viewable by the rep who created it.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (data.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This response example belongs to another rep.' }, { status: 403 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load.' }, { status: 500 })
  }
}

// PATCH /api/sales/response-examples/[id] — update the reviews array:
// editing a response's text, removing a review entirely, or adding a new
// one. Same ownership boundary as GET/DELETE. The frontend always sends
// the complete, already-modified array rather than a single-item diff —
// simpler to reason about than a patch-one-item endpoint, and matches
// the same whole-array-replace pattern the admin audit findings editor
// already uses successfully.
export async function PATCH(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data: demo, error: fetchError } = await supabase
      .from('response_demos')
      .select('id, sales_rep_id, industry')
      .eq('id', params.id)
      .single()

    if (fetchError || !demo) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (demo.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This response example belongs to another rep.' }, { status: 403 })
    }

    const body = await req.json()
    if (!Array.isArray(body.reviews)) {
      return NextResponse.json({ error: 'reviews must be an array.' }, { status: 400 })
    }

    let reviews = body.reviews

    // When the client identifies which review was just hand-edited,
    // re-check it server-side rather than trusting whatever complianceFlag
    // the client sent — this is the actual fix for edits never getting
    // re-scanned. Not run for plain deletes/adds (no editedIndex sent),
    // since those don't touch existing response text.
    if (Number.isInteger(body.editedIndex) && reviews[body.editedIndex]?.draft_response) {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (apiKey) {
        const target = reviews[body.editedIndex]
        const complianceFlag = await checkEditedDraft({
          draft: target.draft_response,
          reviewText: target.review_text,
          industry: demo.industry,
          apiKey,
        })
        reviews = reviews.map((r, i) => i === body.editedIndex ? { ...r, complianceFlag } : r)
      }
      // No ANTHROPIC_API_KEY: falls through and saves complianceFlag as
      // sent (null, from the frontend's optimistic clear) rather than
      // blocking the save entirely over missing AI config.
    }

    const { data, error } = await supabase
      .from('response_demos')
      .update({ reviews, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Response example update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    console.error('Response example update error:', err)
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
  }
}

// DELETE /api/sales/response-examples/[id] — only the rep who created it
// can delete it. If a lead was linked to this demo, clear that link
// (leads.linked_response_demo_id) rather than leaving it pointing at a
// deleted record — the lead itself stays intact either way.
export async function DELETE(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data: demo, error: fetchError } = await supabase
      .from('response_demos')
      .select('id, sales_rep_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !demo) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (demo.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This response example belongs to another rep.' }, { status: 403 })
    }

    await supabase
      .from('leads')
      .update({ linked_response_demo_id: null })
      .eq('linked_response_demo_id', params.id)

    const { error: deleteError } = await supabase
      .from('response_demos')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Response example delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Response example delete error:', err)
    return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
  }
}
