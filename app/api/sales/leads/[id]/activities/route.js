import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Ownership check shared by both handlers below — a rep can see/log
// activity on a lead they own, or one that's currently unclaimed (which,
// per the PATCH route's existing rule, claims it for them).
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
  return { ok: true, lead }
}

// GET /api/sales/leads/[id]/activities — full contact history for a lead,
// newest first.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const access = await checkLeadAccess(params.id, repId)
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*, sales_reps(name)')
      .eq('lead_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Activity list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ activities: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load activity history.' }, { status: 500 })
  }
}

// POST /api/sales/leads/[id]/activities — log a real contact. Requires a
// non-empty note — this is the actual fix for the "click a button to dodge
// the 90-day clock" problem: there's no zero-content way to log contact
// anymore. As a side effect, stamps the parent lead's last_contacted_at
// and claims it if it was unclaimed, exactly like any other real action.
export async function POST(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const access = await checkLeadAccess(params.id, repId)
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  try {
    const { note } = await req.json()
    if (!note || !note.trim() || note.trim().length < 3) {
      return NextResponse.json({ error: 'A brief note about the contact is required.' }, { status: 400 })
    }

    const { data: activity, error: activityError } = await supabase
      .from('lead_activities')
      .insert({ lead_id: params.id, sales_rep_id: repId, note: note.trim() })
      .select('*, sales_reps(name)')
      .single()

    if (activityError) {
      console.error('Activity create error:', activityError)
      return NextResponse.json({ error: activityError.message }, { status: 500 })
    }

    const now = new Date().toISOString()
    const leadUpdates = { last_contacted_at: now, updated_at: now }
    if (!access.lead.sales_rep_id) leadUpdates.sales_rep_id = repId // claim if unclaimed

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', params.id)
      .select()
      .single()

    if (leadError) {
      console.error('Lead timestamp update error:', leadError)
      // The activity itself saved successfully — don't fail the whole
      // request over the follow-up timestamp update.
    }

    return NextResponse.json({ activity, lead })
  } catch (err) {
    console.error('Activity create error:', err)
    return NextResponse.json({ error: 'Failed to log contact.' }, { status: 500 })
  }
}
