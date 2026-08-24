import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/statements — every statement issued to the logged-in
// rep, newest first.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('statements')
      .select('id, period_start, period_end, payout_date, total_cents, created_at')
      .eq('sales_rep_id', repId)
      .order('period_start', { ascending: false })

    if (error) {
      console.error('Statements list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ statements: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load statements.' }, { status: 500 })
  }
}
