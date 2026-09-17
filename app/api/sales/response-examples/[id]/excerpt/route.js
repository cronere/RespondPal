import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../../lib/salesAuth'
import { generateReviewExcerpt } from '../../../../../lib/aiDrafting'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sales/response-examples/[id]/excerpt — generates (or returns
// the already-cached) short excerpt for one review, for the trigger-letter
// tool. Lazy and cached, not generated for every review up front: most
// reviews never become a letter, so paying for an AI call on each one at
// draft time would waste most of that spend. Cached on the review object
// itself once generated, so opening the same letter twice doesn't
// re-generate it.
export async function POST(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    const reviewIndex = body.reviewIndex
    if (!Number.isInteger(reviewIndex)) {
      return NextResponse.json({ error: 'reviewIndex is required.' }, { status: 400 })
    }

    const { data: demo, error: fetchError } = await supabase
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !demo) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (demo.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This response example belongs to another rep.' }, { status: 403 })
    }

    const reviews = demo.reviews || []
    const review = reviews[reviewIndex]
    if (!review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
    }

    // Already generated — return the existing demo as-is rather than
    // spending another API call to regenerate the same excerpt.
    if (review.letterExcerpt) {
      return NextResponse.json({ demo })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
    }

    const excerpt = await generateReviewExcerpt({ reviewText: review.review_text, apiKey })
    if (!excerpt) {
      return NextResponse.json({ error: 'Failed to generate excerpt.' }, { status: 500 })
    }

    const updatedReviews = reviews.map((r, i) => i === reviewIndex ? { ...r, letterExcerpt: excerpt } : r)

    const { data: updated, error: updateError } = await supabase
      .from('response_demos')
      .update({ reviews: updatedReviews, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ demo: updated })
  } catch (err) {
    console.error('Excerpt generation error:', err)
    return NextResponse.json({ error: 'Failed to generate excerpt.' }, { status: 500 })
  }
}
