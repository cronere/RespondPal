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
//
// Two ways to call this:
// 1. { lead_id: '...' } — attach to an existing lead the rep already has.
//    business_name/industry/contact info come authoritatively FROM that
//    lead record (never trusted from the client), so there's no risk of
//    the demo and the lead disagreeing with each other.
// 2. { business_name, industry, ... } with no lead_id — creates a brand
//    new lead automatically, exactly like Request an Audit already does,
//    so a Response Example can never exist without a corresponding lead
//    in the rep's own pipeline.
// Either way, leads.linked_response_demo_id ends up pointing at the demo
// created here — that's the actual link between the two systems.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    let lead = null

    if (body.lead_id) {
      const { data: existingLead, error: leadFetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', body.lead_id)
        .single()

      if (leadFetchError || !existingLead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
      }
      if (existingLead.sales_rep_id !== repId) {
        return NextResponse.json({ error: 'This lead belongs to another rep.' }, { status: 403 })
      }
      lead = existingLead
    } else if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    // Source of truth for these fields is the lead record when one was
    // selected — never a mix of "lead's name, but client-submitted
    // industry" or similar, which could let the two disagree.
    const businessName = lead ? lead.business_name : body.business_name.trim()
    const industry = lead ? lead.industry : ((body.industry || '').trim() || null)
    const contactName = lead ? lead.contact_name : ((body.contact_name || '').trim() || null)
    const contactEmail = lead ? lead.contact_email : ((body.contact_email || '').trim() || null)
    const googleUrl = lead ? lead.google_url : ((body.google_url || '').trim() || null)
    const yelpUrl = lead ? lead.yelp_url : ((body.yelp_url || '').trim() || null)

    // Real enforcement, not just page copy: healthcare leads go through
    // Request an Audit so Jacob personally reviews every finding — Response
    // Examples is for non-healthcare only. Checked server-side because this
    // is the actual security/policy boundary; the client-side warning is
    // just a courtesy that catches the mistake earlier. Applies the same
    // way whether the industry came from a freshly-typed field or an
    // existing lead's record — no path around the block either way.
    if (isHipaaIndustry(industry)) {
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

    const { data: demo, error: demoError } = await supabase
      .from('response_demos')
      .insert({
        sales_rep_id: repId,
        business_name: businessName,
        industry,
        contact_name: contactName,
        contact_email: contactEmail,
        google_url: googleUrl,
        yelp_url: yelpUrl,
        reviews,
        status: 'draft',
      })
      .select()
      .single()

    if (demoError) {
      console.error('Sales response-demo create error:', demoError)
      return NextResponse.json({ error: demoError.message }, { status: 500 })
    }

    // Link back to the lead — either update the existing one, or create a
    // brand new one now that a demo exists to attach it to. Logged but not
    // fatal on failure, same pattern as Request an Audit: the demo itself
    // already saved successfully, and a rep can still use it even if this
    // follow-up link doesn't complete.
    try {
      if (lead) {
        await supabase
          .from('leads')
          .update({ linked_response_demo_id: demo.id, updated_at: new Date().toISOString() })
          .eq('id', lead.id)
      } else {
        await supabase
          .from('leads')
          .insert({
            sales_rep_id: repId,
            original_sales_rep_id: repId,
            business_name: businessName,
            industry,
            contact_name: contactName,
            contact_email: contactEmail,
            google_url: googleUrl,
            yelp_url: yelpUrl,
            stage: 'lead',
            linked_response_demo_id: demo.id,
          })
      }
    } catch (linkErr) {
      console.error('Response-demo lead link error:', linkErr)
    }

    return NextResponse.json({ demo })
  } catch (err) {
    console.error('Sales response-demo create error:', err)
    return NextResponse.json({ error: 'Failed to create response example.' }, { status: 500 })
  }
}
