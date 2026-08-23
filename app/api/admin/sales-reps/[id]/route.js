import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// PATCH /api/admin/sales-reps/[id] — toggle active status. This IS the
// archive mechanism: setting active=false blocks login (enforced in
// /api/sales/auth) but touches nothing else — the rep's leads stay
// assigned to them exactly as they were. If nobody works those leads
// while the rep is archived, they naturally flow into the open pool via
// the existing 90-day release logic (leadOwnership.js) with no special
// case needed here. Reactivating just flips the flag back — any leads
// still assigned to them (haven't hit 90 days) are waiting exactly where
// they left off.
//
// Deliberately no DELETE endpoint: a rep's id is referenced by real
// historical data (leads, audits, clients via original_sales_rep_id /
// original_rep_name) — deleting the row would break those references or
// force nulling them out, destroying exactly the history this system was
// built to preserve. Archive is the only supported way to remove a rep
// from active rotation.
export async function PATCH(req, { params }) {
  try {
    const { active } = await req.json()
    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'active must be true or false.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sales_reps')
      .update({ active })
      .eq('id', params.id)
      .select('id, name, email, active, created_at')
      .single()

    if (error || !data) {
      console.error('Sales rep status update error:', error)
      return NextResponse.json({ error: error?.message || 'Rep not found.' }, { status: 500 })
    }
    return NextResponse.json({ rep: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update rep.' }, { status: 500 })
  }
}
