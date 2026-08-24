import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/payout-periods/approve — Jacob explicitly approves a
// payout period. Body: { period_start, period_end, payout_date }. This is
// the actual finalization gate — reps can see everything accruing toward
// a period in real time, but it's only treated as officially payable once
// this creates or updates a row here with status 'approved'.
export async function POST(req) {
  try {
    const { period_start, period_end, payout_date } = await req.json()
    if (!period_start || !period_end || !payout_date) {
      return NextResponse.json({ error: 'period_start, period_end, and payout_date are required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payout_periods')
      .upsert(
        {
          period_start,
          period_end,
          payout_date,
          status: 'approved',
          approved_at: new Date().toISOString(),
        },
        { onConflict: 'period_start' }
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
