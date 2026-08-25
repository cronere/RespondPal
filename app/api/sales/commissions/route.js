import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'
import { getCommissionRate } from '../../../lib/commissions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/commissions — the logged-in rep's own calculated
// commissions: grouped by payout period (pending vs approved), a lifetime
// total across all time, and a per-client breakdown showing what each
// client has generated so far plus their current ongoing monthly value.
//
// Includes 'payment' and 'adjustment' event types — chargebacks are
// deliberately excluded here, since they don't yet have a calculated
// commission_amount_cents (the clawback-execution logic that would give
// them one isn't built yet), so including them would just show as
// confusing zeros rather than anything meaningful.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data: events, error } = await supabase
      .from('commission_events')
      .select('id, event_type, payout_period_start, payout_period_end, payout_date, commission_amount_cents, commission_month, commission_rate, amount_cents, created_at, disputed, dispute_note, adjusted, adjustment_note, client_id, clients(business_name)')
      .in('event_type', ['payment', 'adjustment'])
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
      .select('period_start, status, approved_at, paid_at')
      .eq('sales_rep_id', repId)
    const statusByPeriod = {}
    for (const p of periodRows || []) statusByPeriod[p.period_start] = p

    const { data: statementRows } = await supabase
      .from('statements')
      .select('id, period_start')
      .eq('sales_rep_id', repId)
    const statementByPeriod = {}
    for (const s of statementRows || []) statementByPeriod[s.period_start] = s.id

    const periods = {}
    let lifetimeTotalCents = 0
    let ytdTotalCents = 0
    const currentYear = new Date().getFullYear()
    const clientTotals = {} // client_id -> lifetime_cents from this client

    for (const e of events || []) {
      const key = e.payout_period_start
      if (!periods[key]) {
        periods[key] = {
          period_start: e.payout_period_start,
          period_end: e.payout_period_end,
          payout_date: e.payout_date,
          status: statusByPeriod[key]?.status || 'pending',
          paid_at: statusByPeriod[key]?.paid_at || null,
          statement_id: statementByPeriod[key] || null,
          total_cents: 0,
          events: [],
        }
      }
      const cents = e.commission_amount_cents || 0
      periods[key].total_cents += cents
      periods[key].events.push(e)
      lifetimeTotalCents += cents
      if (new Date(e.created_at).getFullYear() === currentYear) {
        ytdTotalCents += cents
      }

      if (e.client_id) {
        clientTotals[e.client_id] = (clientTotals[e.client_id] || 0) + cents
      }
    }

    // Fetch current state for every client this rep has ever earned from,
    // to compute what each is generating on an ongoing monthly basis right
    // now — not just what's been earned historically. Also surfaces a
    // light health signal (status + timing only, nothing operational) so
    // a rep isn't completely blind to a client they have real long-term
    // commission exposure to — deliberately stops short of fulfillment
    // detail like tickets or complaints, which stays out of Sales HQ.
    const clientIds = Object.keys(clientTotals)
    let clientValues = []
    if (clientIds.length > 0) {
      const { data: clientRows } = await supabase
        .from('clients')
        .select('id, business_name, status, monthly_rate, commission_months_completed, live_date, cancelled_at')
        .in('id', clientIds)

      const daysSince = (iso) => {
        if (!iso) return null
        return Math.floor((new Date() - new Date(iso)) / (1000 * 60 * 60 * 24))
      }

      clientValues = (clientRows || []).map((c) => {
        // A cancelled client generates no ongoing residual, regardless of
        // what the tier math would otherwise produce — they're not paying
        // anymore, full stop.
        const isActive = c.status === 'active' || c.status === 'onboarding' || c.status === 'paused'
        const currentMonth = c.commission_months_completed || 1
        const currentRate = isActive ? getCommissionRate(currentMonth) : 0
        const nextRate = isActive ? getCommissionRate(currentMonth + 1) : 0
        const monthlyRateCents = Math.round((c.monthly_rate || 0) * 100)

        let health
        if (c.status === 'cancelled') {
          const d = daysSince(c.cancelled_at)
          health = { label: d != null ? `Cancelled ${d}d ago` : 'Cancelled', tone: 'red' }
        } else if (c.status === 'paused') {
          health = { label: 'Paused', tone: 'yellow' }
        } else if (c.status === 'onboarding') {
          health = { label: 'Onboarding — not live yet', tone: 'yellow' }
        } else {
          const d = daysSince(c.live_date)
          health = { label: d != null ? `Active — live ${d}d` : 'Active', tone: 'green' }
        }

        return {
          client_id: c.id,
          business_name: c.business_name,
          status: c.status,
          health,
          lifetime_cents: clientTotals[c.id] || 0,
          monthly_residual_cents: isActive ? Math.round(monthlyRateCents * currentRate) : 0,
          next_month_residual_cents: isActive ? Math.round(monthlyRateCents * nextRate) : 0,
        }
      }).sort((a, b) => b.lifetime_cents - a.lifetime_cents)
    }

    const totalMonthlyResidualCents = clientValues.reduce((sum, c) => sum + c.monthly_residual_cents, 0)
    const totalNextMonthResidualCents = clientValues.reduce((sum, c) => sum + c.next_month_residual_cents, 0)

    const result = Object.values(periods).sort((a, b) => (a.period_start < b.period_start ? 1 : -1))
    return NextResponse.json({
      periods: result,
      lifetime_total_cents: lifetimeTotalCents,
      ytd_total_cents: ytdTotalCents,
      total_monthly_residual_cents: totalMonthlyResidualCents,
      total_next_month_residual_cents: totalNextMonthResidualCents,
      client_values: clientValues,
    })
  } catch (err) {
    console.error('Rep commissions error:', err)
    return NextResponse.json({ error: 'Failed to load commissions.' }, { status: 500 })
  }
}
