import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/sales/me — returns the logged-in rep's own id/name/email.
// Every other sales API route independently re-verifies the session itself
// rather than trusting this — this endpoint exists purely for the UI to
// display "Welcome, Jane" and to know the rep's id for client-side use.
export async function GET(req) {
  try {
    const repId = await getSalesRepId(req)
    if (!repId) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }
    const { data: rep, error } = await supabase
      .from('sales_reps')
      .select('id, name, email, active')
      .eq('id', repId)
      .single()

    if (error || !rep || !rep.active) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }
    return NextResponse.json({ rep: { id: rep.id, name: rep.name, email: rep.email } })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load rep.' }, { status: 500 })
  }
}
