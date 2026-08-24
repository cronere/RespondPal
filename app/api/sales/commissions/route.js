import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/commissions — the logged-in rep's own calculated
// commissions, grouped by payout period, each labeled pending or approved.
// "Pending" means it's accruing but Jacob hasn't signed off on the period
// yet — real-time visibility without implying anything is finalized.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data: events, error } = await supabase
      .from('commission_events')
      .select('id, payout_period_start, payout_period_end, payout_date, commission_amount_cents, commission_month, commission_rate, amount_cents, created_at, clients(business_name)')
      .eq('event_type', 'payment')
      .eq('sales_rep_id', repId)
      .in('status', ['matched', 'reviewed'])
      .not('payout_period_start', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Rep commissions fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: periodRows } = await supabase
      .from('payout_periods')
      .select('period_start, status, approved_at')
      .eq('sales_rep_id', repId)
    const statusByPeriod = {}
    for (const p of periodRows || []) statusByPeriod[p.period_start] = p

    const periods = {}
    for (const e of events || []) {
      const key = e.payout_period_start
      if (!periods[key]) {
        periods[key] = {
          period_start: e.payout_period_start,
          period_end: e.payout_period_end,
          payout_date: e.payout_date,
          status: statusByPeriod[key]?.status || 'pending',
          total_cents: 0,
          events: [],
        }
      }
      periods[key].total_cents += e.commission_amount_cents || 0
      periods[key].events.push(e)
    }

    const result = Object.values(periods).sort((a, b) => (a.period_start < b.period_start ? 1 : -1))
    return NextResponse.json({ periods: result })
  } catch (err) {
    console.error('Rep commissions error:', err)
    return NextResponse.json({ error: 'Failed to load commissions.' }, { status: 500 })
  }
}
