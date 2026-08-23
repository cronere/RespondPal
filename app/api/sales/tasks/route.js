import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/tasks — every task belonging to this rep, across all
// their leads, with the lead's business name joined in so the Tasks tab
// can show which business each task is for without a second lookup.
// Complements (doesn't replace) the per-lead task list on the lead detail
// page — same underlying table, just a different view.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('lead_tasks')
      .select('*, leads(business_name)')
      .eq('sales_rep_id', repId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('All-tasks list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ tasks: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load tasks.' }, { status: 500 })
  }
}

// POST /api/sales/tasks — create a task against a specific lead, from the
// consolidated Tasks tab rather than from inside that lead's own page.
// Same ownership check as the per-lead endpoint.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { lead_id, title, due_date } = await req.json()
    if (!lead_id) {
      return NextResponse.json({ error: 'Please choose which lead this task is for.' }, { status: 400 })
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, sales_rep_id')
      .eq('id', lead_id)
      .single()
    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
    }
    if (lead.sales_rep_id && lead.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This lead belongs to another rep.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('lead_tasks')
      .insert({
        lead_id,
        sales_rep_id: repId,
        title: title.trim(),
        due_date: due_date || null,
      })
      .select('*, leads(business_name)')
      .single()

    if (error) {
      console.error('Task create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ task: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 })
  }
}
