import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/me — returns the logged-in rep's own id/name/email/active
// status. Every other sales API route independently re-verifies the
// session itself rather than trusting this — this endpoint exists purely
// for the UI to display "Welcome, Jane," restrict navigation for an
// archived rep, and know the rep's id for client-side use.
export async function GET(req) {
  try {
    const repId = await getSalesRepId(req)
    if (!repId) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }
    const { data: rep, error } = await supabase
      .from('sales_reps')
      .select('id, name, email, active, stripe_payment_links')
      .eq('id', repId)
      .single()

    // A missing rep row means the session token is stale/invalid — that's
    // still "not signed in." An archived rep, on the other hand, has a
    // perfectly valid session; they're just restricted to statements only,
    // which the layout enforces using the active flag returned below.
    if (error || !rep) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }
    return NextResponse.json({ rep: { id: rep.id, name: rep.name, email: rep.email, active: rep.active, stripe_payment_links: rep.stripe_payment_links } })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load rep.' }, { status: 500 })
  }
}
