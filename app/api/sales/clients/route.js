import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/clients — read-only list of active/onboarding/paused
// clients, with enough identifying detail that a rep can be certain which
// business this is — name alone isn't enough once there are multiple
// locations or similarly-named businesses. No editing capability here;
// this exists purely so a rep can positively identify a business before
// deciding whether to pursue it as a new lead. There's no dedicated
// "website" field in the clients table — google_profile_email and
// yelp_url are the closest equivalents, included instead.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, business_name, industry, state, status, phone, owner_name, rep_name, google_profile_email, yelp_url')
      .in('status', ['active', 'onboarding', 'paused'])
      .order('business_name', { ascending: true })

    if (error) {
      console.error('Sales clients list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ clients: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load clients.' }, { status: 500 })
  }
}
