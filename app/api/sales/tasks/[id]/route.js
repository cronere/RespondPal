import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// PATCH /api/sales/tasks/[id] — edit title/due date, or check it off.
// Scoped by sales_rep_id — a task belongs to whoever created it, not
// tied to current lead ownership, since a task is a personal reminder.
export async function PATCH(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    const updates = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.due_date !== undefined) updates.due_date = body.due_date
    if (body.completed !== undefined) {
      updates.completed = body.completed
      updates.completed_at = body.completed ? new Date().toISOString() : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('lead_tasks')
      .update(updates)
      .eq('id', params.id)
      .eq('sales_rep_id', repId)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Task not found.' }, { status: 404 })
    }
    return NextResponse.json({ task: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 })
  }
}

// DELETE /api/sales/tasks/[id]
export async function DELETE(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { error } = await supabase
      .from('lead_tasks')
      .delete()
      .eq('id', params.id)
      .eq('sales_rep_id', repId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete task.' }, { status: 500 })
  }
}
