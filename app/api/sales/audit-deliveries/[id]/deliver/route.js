import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sales/audit-deliveries/[id]/deliver — the rep confirms they
// actually sent the finished report (Loom + PDF) to their prospect. Sets
// rep_delivered_at, and logs it as a real activity entry on the linked
// lead — the same treatment as any other genuine contact, and it also
// refreshes last_contacted_at, extending the 90-day ownership clock.
export async function POST(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data: audit, error: fetchError } = await supabase
      .from('audits')
      .select('id, business_name, sales_rep_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !audit) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (audit.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This audit belongs to another rep.' }, { status: 403 })
    }
    if (!['delivered', 'converted'].includes(audit.status)) {
      return NextResponse.json({ error: 'This audit hasn\'t been pushed to you yet.' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase
      .from('audits')
      .update({ rep_delivered_at: now })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Audit rep-delivery update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log the delivery on the linked lead, if one exists — same treatment
    // as any other genuine contact activity.
    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('linked_audit_id', audit.id)
        .eq('sales_rep_id', repId)
        .single()

      if (lead) {
        await supabase.from('lead_activities').insert({
          lead_id: lead.id,
          sales_rep_id: repId,
          note: `Delivered the Reputation Risk Audit report for ${audit.business_name}.`,
        })
        await supabase
          .from('leads')
          .update({ last_contacted_at: now })
          .eq('id', lead.id)
      }
    } catch (activityErr) {
      console.error('Audit delivery activity log error:', activityErr)
    }

    return NextResponse.json({ audit: updated })
  } catch (err) {
    console.error('Audit rep-delivery error:', err)
    return NextResponse.json({ error: 'Failed to mark delivered.' }, { status: 500 })
  }
}
