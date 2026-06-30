import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const EDITABLE_FIELDS = ['status', 'internal_notes']

// PATCH /api/admin/feedback/[id] — update status or internal notes.
export async function PATCH(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()
    const updates = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) updates[key] = body[key]
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select('*, clients(business_name)')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ feedback: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update feedback.' }, { status: 500 })
  }
}

// DELETE /api/admin/feedback/[id]
export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const { error } = await supabaseAdmin.from('feedback').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete feedback.' }, { status: 500 })
  }
}
