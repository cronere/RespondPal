import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/clients/[id]/log-referral — Section 4.6 support. Logs a
// blind referral (came in to the Company generally, not addressed to a
// specific rep) from an existing client, and creates the new lead
// pre-assigned to that client's CURRENT rep — per the contract, they get
// first crack at it under the same terms as any other new lead.
//
// The referring client's rep is read from clients.sales_rep_id, the same
// field the commissions system treats as authoritative — never from the
// separate, manually-editable rep_name text field, which could be stale
// or mistyped and isn't the real ownership record.
//
// referral_offered_at is stamped here, at creation, not editable
// afterward through this route — that's what makes it an actual paper
// trail rather than a claim someone could adjust later.
export async function POST(req, { params }) {
  try {
    const { id: clientId } = params
    const body = await req.json()

    if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, business_name, sales_rep_id')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Referring client not found.' }, { status: 404 })
    }
    if (!client.sales_rep_id) {
      return NextResponse.json({
        error: `${client.business_name} has no rep on file to offer this referral to. Set a rep on this client first.`,
      }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        sales_rep_id: client.sales_rep_id,
        original_sales_rep_id: client.sales_rep_id,
        business_name: body.business_name.trim(),
        contact_name: (body.contact_name || '').trim() || null,
        contact_email: (body.contact_email || '').trim() || null,
        contact_phone: (body.contact_phone || '').trim() || null,
        industry: (body.industry || '').trim() || null,
        state: (body.state || '').trim() || null,
        notes: (body.notes || '').trim() || null,
        stage: 'lead',
        referred_by_client_id: client.id,
        referral_offered_to_rep_id: client.sales_rep_id,
        referral_offered_at: now,
      })
      .select('*, sales_reps(name)')
      .single()

    if (leadError) {
      console.error('Referral log error:', leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    return NextResponse.json({ lead })
  } catch (err) {
    console.error('Referral log error:', err)
    return NextResponse.json({ error: 'Failed to log referral.' }, { status: 500 })
  }
}
