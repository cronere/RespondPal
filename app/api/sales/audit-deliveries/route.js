import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/audit-deliveries — audits Jacob has pushed to this rep
// (status = 'delivered' or 'converted' from admin's side, meaning his part
// is done). Split into ready-to-deliver vs delivered on the frontend using
// rep_delivered_at — null means the rep hasn't confirmed sending it to
// their prospect yet, set means they have. An audit still sitting in
// Jacob's own queue (status = new/analyzing/ready) never appears here at
// all — reps only see it once it's actually been pushed to them.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('audits')
      .select('id, business_name, industry, contact_name, contact_email, status, rep_delivered_at, created_at')
      .eq('sales_rep_id', repId)
      .in('status', ['delivered', 'converted'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Audit deliveries list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ audits: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load.' }, { status: 500 })
  }
}
