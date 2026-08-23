import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/counts — badge counts for the Sales HQ sidebar.
// tasksDue: incomplete tasks with a due date today or earlier.
// auditsReady: audits pushed to this rep that they haven't marked
// delivered yet (same "Ready to Deliver" definition used on the
// My Audit Requests tab).
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ tasksDue: 0, auditsReady: 0 })

  try {
    const today = new Date().toISOString().split('T')[0]

    const [tasksRes, auditsRes] = await Promise.all([
      supabase
        .from('lead_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('sales_rep_id', repId)
        .eq('completed', false)
        .lte('due_date', today)
        .not('due_date', 'is', null),
      supabase
        .from('audits')
        .select('id', { count: 'exact', head: true })
        .eq('sales_rep_id', repId)
        .in('status', ['delivered', 'converted'])
        .is('rep_delivered_at', null),
    ])

    return NextResponse.json({
      tasksDue: tasksRes.count || 0,
      auditsReady: auditsRes.count || 0,
    })
  } catch (err) {
    // Never break the layout over a count fetch — just return zeros,
    // same pattern as the admin counts endpoint.
    return NextResponse.json({ tasksDue: 0, auditsReady: 0 })
  }
}
