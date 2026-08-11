import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/response-demos — list all demos, newest first.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('response_demos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Response demos list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demos: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load response demos.' }, { status: 500 })
  }
}

// POST /api/admin/response-demos — create a new demo shell with up to 5
// reviews (no drafts yet — call the /generate endpoint separately).
export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.business_name) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const reviews = (body.reviews || []).map((r) => ({
      platform: r.platform || 'Google',
      star_rating: r.star_rating || null,
      reviewer_name: r.reviewer_name || '',
      review_text: r.review_text || '',
      draft_response: null,
      complianceFlag: null,
    }))

    const { data, error } = await supabaseAdmin
      .from('response_demos')
      .insert({
        business_name: body.business_name,
        industry: body.industry || null,
        contact_name: body.contact_name || null,
        contact_email: body.contact_email || null,
        google_url: body.google_url || null,
        yelp_url: body.yelp_url || null,
        total_reviews: body.total_reviews || null,
        response_rate: body.response_rate || null,
        reviews,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Response demo creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    console.error('Response demo creation error:', err)
    return NextResponse.json({ error: 'Failed to create response demo.' }, { status: 500 })
  }
}
