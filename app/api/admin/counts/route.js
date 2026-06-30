import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/counts — badge counts for the sidebar.
// reviews: anything not posted or skipped (matches the "Needs response" tab)
// feedback: anything new or in_progress (matches the "Open" tab)
export async function GET() {
  try {
    const [reviewsRes, feedbackRes] = await Promise.all([
      supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .not('response_status', 'in', '("posted","skipped")'),
      supabaseAdmin
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .in('status', ['new', 'in_progress']),
    ])

    return NextResponse.json({
      reviews: reviewsRes.count || 0,
      feedback: feedbackRes.count || 0,
    })
  } catch (err) {
    // Never break the layout over a count fetch — just return zeros.
    return NextResponse.json({ reviews: 0, feedback: 0 })
  }
}
