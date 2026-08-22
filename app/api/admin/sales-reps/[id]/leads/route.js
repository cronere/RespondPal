import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/sales-reps/[id]/leads — every lead belonging to one rep,
// for the inline view on that rep's row in Sales Team. Admin-only, same as
// every other /api/admin route — protected by the existing /admin
// middleware gate, not by rep-session logic (this is Jacob looking at a
// rep's data, not the rep themselves).
export async function GET(req, { params }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('sales_rep_id', params.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Rep leads fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ leads: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load leads.' }, { status: 500 })
  }
}
