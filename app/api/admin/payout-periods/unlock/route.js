import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/payout-periods/unlock — reverts an approved rep-period
// back to pending, so corrections can be made directly before
// re-approving. Only works on 'approved' — a 'paid' period is locked
// permanently and this deliberately refuses to touch it. Any correction
// needed after payment has to be a new adjustment against a different,
// unlocked period instead — the paid record itself, and the statement
// already generated from it, never change.
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
      return NextResponse.json({ error: 'This period isn\'t approved — nothing to unlock.' }, { status: 404 })
    }
    if (existing.status === 'paid') {
      return NextResponse.json({ error: 'This period has already been paid and is locked permanently. Use a manual adjustment against a different period instead.' }, { status: 400 })
    }
    if (existing.status !== 'approved') {
      return NextResponse.json({ error: `This period is already "${existing.status}" — nothing to unlock.` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payout_periods')
      .update({ status: 'pending', approved_at: null })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Unlock period error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ period: data })
  } catch (err) {
    console.error('Unlock period error:', err)
    return NextResponse.json({ error: 'Failed to unlock period.' }, { status: 500 })
  }
}
