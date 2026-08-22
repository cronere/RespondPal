import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'
import { releaseStaleLeads } from '../../../../lib/leadOwnership'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/sales/leads/open — every unclaimed lead (sales_rep_id is null),
// visible to any signed-in rep. Just needs a valid session, not ownership
// of anything specific — that's the point of this endpoint.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    await releaseStaleLeads(supabase)

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .is('sales_rep_id', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Open leads list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ leads: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load open leads.' }, { status: 500 })
  }
}
