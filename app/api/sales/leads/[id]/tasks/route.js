import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function checkLeadAccess(leadId, repId) {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, sales_rep_id')
    .eq('id', leadId)
    .single()
  if (error || !lead) return { ok: false, status: 404, message: 'Lead not found.' }
  if (lead.sales_rep_id && lead.sales_rep_id !== repId) {
    return { ok: false, status: 403, message: 'This lead belongs to another rep.' }
  }
  return { ok: true }
}

// GET /api/sales/leads/[id]/tasks — every task on this lead, soonest due
// date first, undated tasks last.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const access = await checkLeadAccess(params.id, repId)
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { data, error } = await supabase
      .from('lead_tasks')
      .select('*')
      .eq('lead_id', params.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Tasks list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ tasks: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load tasks.' }, { status: 500 })
  }
}

// POST /api/sales/leads/[id]/tasks — create a task on this lead.
export async function POST(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const access = await checkLeadAccess(params.id, repId)
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { title, due_date } = await req.json()
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('lead_tasks')
      .insert({
        lead_id: params.id,
        sales_rep_id: repId,
        title: title.trim(),
        due_date: due_date || null,
      })
      .select()
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
