import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { releaseStaleLeadsForRep } from '../../../../lib/leadOwnership'

// PATCH /api/admin/sales-reps/[id] — toggle active status. This IS the
// archive mechanism: setting active=false blocks login (enforced in
// /api/sales/auth).
//
// Archiving also immediately releases any of the rep's leads that are
// already past the 90-day activity window — rather than waiting for the
// normal lazy sweep to eventually touch them, which could otherwise leave
// those leads locked and untouchable by anyone for a long time after the
// rep is gone. Leads still within the 90-day window are left alone — a
// lead the rep was genuinely, recently working shouldn't be ripped away
// the instant they're archived, only the ones already effectively
// abandoned. Reactivating just flips the flag back and touches nothing
// else; anything not already released is waiting where it was left.
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

    if (active === false) {
      await releaseStaleLeadsForRep(supabaseAdmin, params.id)
    }

    return NextResponse.json({ rep: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update rep.' }, { status: 500 })
  }
}
