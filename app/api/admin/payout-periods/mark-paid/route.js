import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

// POST /api/admin/payout-periods/mark-paid — confirms the actual ACH
// transfer happened (through QuickBooks Contractor Payments or however
// else). Deliberately a separate action from Approve, since those are two
// genuinely different events: "I've reviewed and confirmed this is
// correct" versus "the money has actually moved." Only works on a period
// that's already approved.
//
// Also generates the permanent statement snapshot (Section 3.5 of the rep
// agreement) and emails the rep — this is the one moment both of those
// things should happen, since "paid" is the actual event being confirmed
// and documented.
export async function POST(req) {
  try {
    const { period_start, sales_rep_id } = await req.json()
    if (!period_start || !sales_rep_id) {
      return NextResponse.json({ error: 'period_start and sales_rep_id are required.' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('payout_periods')
      .select('id, status, period_end, payout_date')
      .eq('period_start', period_start)
      .eq('sales_rep_id', sales_rep_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'This period hasn\'t been approved yet.' }, { status: 404 })
    }
    if (existing.status !== 'approved') {
      return NextResponse.json({ error: `Can't mark as paid — current status is "${existing.status}", not "approved".` }, { status: 400 })
    }

    // Snapshot the exact commission data at this moment — permanently,
    // independent of anything that might change about these records
    // later (a client renamed, a future correction to an unrelated event).
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('commission_events')
      .select('event_type, commission_month, commission_rate, commission_amount_cents, created_at, clients(business_name)')
      .eq('sales_rep_id', sales_rep_id)
      .eq('payout_period_start', period_start)
      .in('event_type', ['payment', 'adjustment'])
      .in('status', ['matched', 'reviewed'])

    if (eventsError) {
      console.error('Mark paid — failed to fetch events for statement:', eventsError)
      return NextResponse.json({ error: 'Failed to build statement snapshot.' }, { status: 500 })
    }

    const lineItems = (events || []).map((e) => ({
      description: e.event_type === 'adjustment' ? 'Manual adjustment' : (e.clients?.business_name || 'Unknown client'),
      commission_month: e.commission_month,
      commission_rate: e.commission_rate,
      commission_amount_cents: e.commission_amount_cents,
      date: e.created_at,
    }))
    const totalCents = lineItems.reduce((sum, li) => sum + (li.commission_amount_cents || 0), 0)

    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .upsert(
        {
          sales_rep_id,
          period_start,
          period_end: existing.period_end,
          payout_date: existing.payout_date,
          total_cents: totalCents,
          line_items: lineItems,
        },
        { onConflict: 'sales_rep_id,period_start' }
      )
      .select()
      .single()

    if (statementError) {
      console.error('Mark paid — failed to generate statement:', statementError)
      return NextResponse.json({ error: 'Failed to generate statement.' }, { status: 500 })
    }

    const { data: period, error: updateError } = await supabaseAdmin
      .from('payout_periods')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      console.error('Mark paid error:', updateError)
      return NextResponse.json({ error: 'Statement was generated, but failed to update period status. Please check manually.' }, { status: 500 })
    }

    // Notify the rep — failure here shouldn't block the payment record
    // itself from being correct, same tolerance pattern used elsewhere in
    // this app for non-critical email sends.
    try {
      const { data: rep } = await supabaseAdmin
        .from('sales_reps')
        .select('name, email')
        .eq('id', sales_rep_id)
        .single()

      if (rep?.email) {
        await transporter.sendMail({
          from: `"RespondPal" <${process.env.GMAIL_USER}>`,
          to: rep.email,
          subject: `Payment sent — $${(totalCents / 100).toFixed(2)}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
              <h2 style="color:#15803d;margin-bottom:4px">Your commission has been paid</h2>
              <p>Hi ${rep.name?.split(' ')[0] || ''},</p>
              <p>Your payout for <b>${period_start} to ${existing.period_end}</b> has been sent —
              <b>$${(totalCents / 100).toFixed(2)}</b> total.</p>
              <p>Your full statement is available anytime: <a href="https://www.respondpal.ai/sales/commissions" style="color:#C2410C;font-weight:600;">My Commissions →</a></p>
              <p style="color:#6b7280;font-size:13px">If anything looks off, you can dispute a specific
              line item directly from your commissions page — per your agreement, within 30 days.</p>
              <p>— Jacob</p>
            </div>
          `,
        })
      }
    } catch (mailErr) {
      console.error('Mark paid — notification email error:', mailErr)
    }

    return NextResponse.json({ period, statement })
  } catch (err) {
    console.error('Mark paid error:', err)
    return NextResponse.json({ error: 'Failed to mark as paid.' }, { status: 500 })
  }
}
