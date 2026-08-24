import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/payout-periods/mark-paid — confirms the actual ACH
// transfer happened (through QuickBooks Contractor Payments or however
// else). Deliberately a separate action from Approve, since those are two
// genuinely different events: "I've reviewed and confirmed this is
// correct" versus "the money has actually moved." Only works on a period
// that's already approved — paying something you haven't signed off on
// yet shouldn't be possible through this action.
export async function POST(req) {
  try {
    const { period_start, sales_rep_id } = await req.json()
    if (!period_start || !sales_rep_id) {
      return NextResponse.json({ error: 'period_start and sales_rep_id are required.' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('payout_periods')
      .select('id, status')
      .eq('period_start', period_start)
      .eq('sales_rep_id', sales_rep_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'This period hasn\'t been approved yet.' }, { status: 404 })
    }
    if (existing.status !== 'approved') {
      return NextResponse.json({ error: `Can't mark as paid — current status is "${existing.status}", not "approved".` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payout_periods')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Mark paid error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ period: data })
  } catch (err) {
    console.error('Mark paid error:', err)
    return NextResponse.json({ error: 'Failed to mark as paid.' }, { status: 500 })
  }
}
