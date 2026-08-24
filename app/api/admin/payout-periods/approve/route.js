import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/payout-periods/approve — approves ONE rep's portion of
// ONE payout period. Body: { period_start, period_end, payout_date,
// sales_rep_id }. Deliberately per-rep, not period-wide — this is the
// actual fix for "I don't want to approve this period for someone because
// their commissions look wrong": approve everyone else, hold that one
// rep's portion back, without blocking the whole period.
export async function POST(req) {
  try {
    const { period_start, period_end, payout_date, sales_rep_id } = await req.json()
    if (!period_start || !period_end || !payout_date || !sales_rep_id) {
      return NextResponse.json({ error: 'period_start, period_end, payout_date, and sales_rep_id are all required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payout_periods')
      .upsert(
        {
          period_start,
          period_end,
          payout_date,
          sales_rep_id,
          status: 'approved',
          approved_at: new Date().toISOString(),
        },
        { onConflict: 'period_start,sales_rep_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Payout period approve error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ period: data })
  } catch (err) {
    console.error('Payout period approve error:', err)
    return NextResponse.json({ error: 'Failed to approve period.' }, { status: 500 })
  }
}
