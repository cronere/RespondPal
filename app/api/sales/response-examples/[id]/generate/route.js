import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../../lib/salesAuth'
import { generateCompliantDraft } from '../../../../../lib/aiDrafting'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sales/response-examples/[id]/generate — identical drafting
// pipeline to the admin version (same shared generateCompliantDraft — no
// separate, potentially-weaker "rep version" of the compliance system),
// with an ownership check added since this is reachable by any signed-in
// rep, not just admin.
export async function POST(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
    }

    const { data: demo, error: fetchError } = await supabase
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !demo) {
      return NextResponse.json({ error: 'Response example not found.' }, { status: 404 })
    }
    if (demo.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This response example belongs to another rep.' }, { status: 403 })
    }

    const reviews = demo.reviews || []
    if (reviews.length === 0) {
      return NextResponse.json({ error: 'Add at least one review before generating.' }, { status: 400 })
    }

    const client = {
      business_name: demo.business_name,
      industry: demo.industry,
      response_tone: 'professional_friendly',
    }

    const updatedReviews = []
    const errors = []
    for (const review of reviews) {
      if (review.draft_response) {
        updatedReviews.push(review)
        continue
      }
      try {
        const { draft, complianceFlag } = await generateCompliantDraft({
          review: {
            platform: review.platform,
            star_rating: review.star_rating,
            reviewer_name: review.reviewer_name,
            review_text: review.review_text,
          },
          client,
          apiKey,
        })
        updatedReviews.push({ ...review, draft_response: draft, complianceFlag })
      } catch (err) {
        console.error('Failed to draft response for review:', review.reviewer_name, err.message)
        errors.push(review.reviewer_name || 'a review')
        updatedReviews.push(review)
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('response_demos')
      .update({ reviews: updatedReviews, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to save generated drafts:', updateError)
      return NextResponse.json({ error: 'Failed to save generated drafts.' }, { status: 500 })
    }

    return NextResponse.json({
      demo: updated,
      warning: errors.length > 0 ? `Failed to draft: ${errors.join(', ')}. Try generating again.` : null,
    })
  } catch (err) {
    console.error('Sales response-demo generate error:', err)
    return NextResponse.json({ error: 'Failed to generate responses.' }, { status: 500 })
  }
}
