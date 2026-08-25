import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// Always fetch fresh — never serve a cached client list.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/clients — return all clients for the roster.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Clients list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clients: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load clients.' }, { status: 500 })
  }
}

// POST /api/admin/clients — manually create a client directly in HQ, bypassing
// the Stripe payment + onboarding form flow. Built for warm-network / trial
// clients (e.g. friends given a free trial) where there's no payment event to
// trigger the normal onboarding path, but the client record is still needed
// so reviews can be tracked, drafted, and managed like any other client.
export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.business_name) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({
        business_name: body.business_name,
        owner_name: body.owner_name || null,
        email: body.email || null,
        phone: body.phone || null,
        industry: body.industry || null,
        state: body.state || null,
        status: body.status || 'onboarding',
        plan: body.plan || 'monthly',
        locations: body.locations || 1,
        monthly_rate: body.monthly_rate || 0,
        cleanup_status: body.cleanup_status || 'not_applicable',
        google_access: false,
        yelp_access: false,
        google_profile_email: body.google_profile_email || null,
        yelp_url: body.yelp_url || null,
        response_tone: body.response_tone || 'professional_friendly',
        response_signer: body.response_signer || null,
        things_to_avoid: body.things_to_avoid || null,
        business_tagline: body.business_tagline || null,
        ai_instructions: body.ai_instructions || null,
        rep_name: body.rep_name || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Client creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ client: data })
  } catch (err) {
    console.error('Client creation error:', err)
    return NextResponse.json({ error: 'Failed to create client.' }, { status: 500 })
  }
}
