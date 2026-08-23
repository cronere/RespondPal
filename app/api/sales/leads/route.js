import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'
import { releaseStaleLeads } from '../../../lib/leadOwnership'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/leads — list ONLY the logged-in rep's own leads. Every
// query in this file filters by sales_rep_id from the verified session,
// never from anything the client sends — a rep cannot see or affect
// another rep's pipeline by manipulating a request body.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    await releaseStaleLeads(supabase)

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('sales_rep_id', repId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Leads list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ leads: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load leads.' }, { status: 500 })
  }
}

// POST /api/sales/leads — create a new lead, automatically attributed to
// the logged-in rep. original_sales_rep_id is set once here and never
// changes, even if ownership later transfers via the 90-day rule.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        sales_rep_id: repId,
        original_sales_rep_id: repId,
        business_name: body.business_name.trim(),
        contact_name: (body.contact_name || '').trim() || null,
        contact_email: (body.contact_email || '').trim() || null,
        contact_phone: (body.contact_phone || '').trim() || null,
        industry: (body.industry || '').trim() || null,
        google_url: (body.google_url || '').trim() || null,
        yelp_url: (body.yelp_url || '').trim() || null,
        notes: (body.notes || '').trim() || null,
        stage: 'lead',
      })
      .select()
      .single()

    if (error) {
      console.error('Lead create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500 })
  }
}
