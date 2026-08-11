import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin'
import { generateCompliantDraft } from '../../../../../../lib/aiDrafting'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/response-demos/[id]/generate — drafts a compliant response
// for every review on this demo that doesn't already have one, using the
// EXACT same drafting pipeline (prompt + compliance check + blocklist) as
// live client responses. This is the whole point of extracting the shared
// library: the demo you show a prospect uses identical logic to what would
// actually run on their account if they became a client — no separate,
// potentially-weaker "sales demo" version of the compliance system.
export async function POST(req, { params }) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
    }

    const { data: demo, error: fetchError } = await supabaseAdmin
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !demo) {
      return NextResponse.json({ error: 'Response demo not found.' }, { status: 404 })
    }

    const reviews = demo.reviews || []
    if (reviews.length === 0) {
      return NextResponse.json({ error: 'Add at least one review before generating.' }, { status: 400 })
    }

    // Build a minimal "client" object matching what the shared drafting
    // library expects — the demo tool doesn't have a full client record
    // (things_to_avoid, tone preferences, etc.), so it defaults to a
    // professional-friendly tone with no custom instructions, which is the
    // right default for a first-impression showcase.
    const client = {
      business_name: demo.business_name,
      industry: demo.industry,
      response_tone: 'professional_friendly',
    }

    const updatedReviews = []
    const errors = []
    for (const review of reviews) {
      if (review.draft_response) {
        // Already drafted — leave as-is rather than re-spending API calls.
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
        updatedReviews.push(review) // leave undrafted rather than losing the review
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
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
    console.error('Response demo generate error:', err)
    return NextResponse.json({ error: 'Failed to generate responses.' }, { status: 500 })
  }
}
