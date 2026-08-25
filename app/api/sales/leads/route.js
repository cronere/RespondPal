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
//
// Collision check: before creating, looks for an ACTIVE lead (currently
// owned by a different rep — unclaimed or same-rep leads don't count as
// collisions) with a matching business name or matching Google/Yelp URL.
// URL matches are the more reliable signal — two different businesses can
// easily share a name, but they can't share the same Google Maps listing.
// If a match is found and the client hasn't explicitly confirmed past it
// (confirmDuplicate: true), returns the match instead of creating anything
// — the rep sees who already has it and decides whether to proceed. This
// is the actual fix for two reps independently adding the same business
// as separate, mutually-invisible leads.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const businessName = body.business_name.trim()
    const googleUrl = (body.google_url || '').trim() || null
    const yelpUrl = (body.yelp_url || '').trim() || null

    if (!body.confirmDuplicate) {
      let matchQuery = supabase
        .from('leads')
        .select('id, business_name, sales_rep_id, sales_reps(name)')
        .not('sales_rep_id', 'is', null)
        .neq('sales_rep_id', repId)

      // Match on name (case-insensitive) OR either URL — whichever is
      // present. Built as separate checks rather than one combined filter
      // string, same reasoning as the leadOwnership.js fix earlier: clearer
      // to read and avoids uncertain PostgREST filter syntax.
      const { data: nameMatch } = await matchQuery.ilike('business_name', businessName)
      let existingMatch = nameMatch && nameMatch[0]

      if (!existingMatch && googleUrl) {
        const { data: urlMatch } = await supabase
          .from('leads')
          .select('id, business_name, sales_rep_id, sales_reps(name)')
          .not('sales_rep_id', 'is', null)
          .neq('sales_rep_id', repId)
          .eq('google_url', googleUrl)
        existingMatch = urlMatch && urlMatch[0]
      }
      if (!existingMatch && yelpUrl) {
        const { data: urlMatch } = await supabase
          .from('leads')
          .select('id, business_name, sales_rep_id, sales_reps(name)')
          .not('sales_rep_id', 'is', null)
          .neq('sales_rep_id', repId)
          .eq('yelp_url', yelpUrl)
        existingMatch = urlMatch && urlMatch[0]
      }

      if (existingMatch) {
        return NextResponse.json({
          needsConfirmation: true,
          match: {
            businessName: existingMatch.business_name,
            ownedBy: existingMatch.sales_reps?.name || 'another rep',
          },
        }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        sales_rep_id: repId,
        original_sales_rep_id: repId,
        business_name: businessName,
        contact_name: (body.contact_name || '').trim() || null,
        contact_email: (body.contact_email || '').trim() || null,
        contact_phone: (body.contact_phone || '').trim() || null,
        industry: (body.industry || '').trim() || null,
        state: (body.state || '').trim() || null,
        google_url: googleUrl,
        yelp_url: yelpUrl,
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
