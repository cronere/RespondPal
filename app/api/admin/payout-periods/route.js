import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/payout-periods — every payout period that has at least
// one calculated commission in it, with totals broken down by rep.
// Grouping happens here in JS rather than a database aggregate — simplest
// approach at current scale, and avoids a custom SQL function for now.
export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('commission_events')
      .select('payout_period_start, payout_period_end, payout_date, sales_rep_id, commission_amount_cents, sales_reps(name)')
      .eq('event_type', 'payment')
      .in('status', ['matched', 'reviewed'])
      .not('payout_period_start', 'is', null)

    if (error) {
      console.error('Payout periods fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: periodRows } = await supabaseAdmin.from('payout_periods').select('*')
    const statusByPeriod = {}
    for (const p of periodRows || []) statusByPeriod[p.period_start] = p

    // Group by payout_period_start
    const periods = {}
    for (const e of events || []) {
      const key = e.payout_period_start
      if (!periods[key]) {
        periods[key] = {
          period_start: e.payout_period_start,
          period_end: e.payout_period_end,
          payout_date: e.payout_date,
          status: statusByPeriod[key]?.status || 'pending',
          approved_at: statusByPeriod[key]?.approved_at || null,
          total_cents: 0,
          reps: {},
        }
      }
      periods[key].total_cents += e.commission_amount_cents || 0
      const repId = e.sales_rep_id || 'unassigned'
      const repName = e.sales_reps?.name || 'Unassigned'
      if (!periods[key].reps[repId]) {
        periods[key].reps[repId] = { sales_rep_id: e.sales_rep_id, name: repName, total_cents: 0, count: 0 }
      }
      periods[key].reps[repId].total_cents += e.commission_amount_cents || 0
      periods[key].reps[repId].count += 1
    }

    const result = Object.values(periods)
      .map((p) => ({ ...p, reps: Object.values(p.reps) }))
      .sort((a, b) => (a.period_start < b.period_start ? 1 : -1))

    return NextResponse.json({ periods: result })
  } catch (err) {
    console.error('Payout periods error:', err)
    return NextResponse.json({ error: 'Failed to load payout periods.' }, { status: 500 })
  }
}
