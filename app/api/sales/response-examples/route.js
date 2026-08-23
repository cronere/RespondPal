import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'
import { isHipaaIndustry } from '../../../lib/aiDrafting'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/sales/response-examples — list ONLY the logged-in rep's own
// demos. Same data-isolation pattern as leads: filtered by sales_rep_id
// from the verified session, never from client input.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('response_demos')
      .select('*')
      .eq('sales_rep_id', repId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Sales response-demos list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demos: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load response examples.' }, { status: 500 })
  }
}

// POST /api/sales/response-examples — create a new demo shell with up to 5
// reviews, attributed to the logged-in rep. No drafts yet — call generate
// separately, same two-step flow as the admin version.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    // Real enforcement, not just page copy: healthcare leads go through
    // Request an Audit so Jacob personally reviews every finding — Response
    // Examples is for non-healthcare only. Checked server-side because this
    // is the actual security/policy boundary; the client-side warning is
    // just a courtesy that catches the mistake earlier.
    if (isHipaaIndustry(body.industry)) {
      return NextResponse.json(
        { error: 'This looks like a healthcare business. Please use "Request an Audit" instead — healthcare leads need Jacob\'s compliance review.' },
        { status: 400 }
      )
    }

    const reviews = (body.reviews || []).slice(0, 5).map((r) => ({
      platform: r.platform || 'Google',
      star_rating: r.star_rating || null,
      reviewer_name: r.reviewer_name || '',
      review_text: r.review_text || '',
      draft_response: null,
      complianceFlag: null,
    }))

    const { data, error } = await supabase
      .from('response_demos')
      .insert({
        sales_rep_id: repId,
        business_name: body.business_name.trim(),
        industry: (body.industry || '').trim() || null,
        contact_name: (body.contact_name || '').trim() || null,
        contact_email: (body.contact_email || '').trim() || null,
        google_url: (body.google_url || '').trim() || null,
        yelp_url: (body.yelp_url || '').trim() || null,
        reviews,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Sales response-demo create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    console.error('Sales response-demo create error:', err)
    return NextResponse.json({ error: 'Failed to create response example.' }, { status: 500 })
  }
}
