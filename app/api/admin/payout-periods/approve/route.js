import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

// POST /api/admin/payout-periods/approve — approves ONE rep's portion of
// ONE payout period. Body: { period_start, period_end, payout_date,
// sales_rep_id }. Deliberately per-rep, not period-wide — this is the
// actual fix for "I don't want to approve this period for someone because
// their commissions look wrong": approve everyone else, hold that one
// rep's portion back, without blocking the whole period.
export async function POST(req) {
  try {
    const { period_start, period_end, payout_date, sales_rep_id } = await req.json()
    if (!period_start || !period_end || !payout_date || !sales_rep_id) {
      return NextResponse.json({ error: 'period_start, period_end, payout_date, and sales_rep_id are all required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payout_periods')
      .upsert(
        {
          period_start,
          period_end,
          payout_date,
          sales_rep_id,
          status: 'approved',
          approved_at: new Date().toISOString(),
        },
        { onConflict: 'period_start,sales_rep_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Payout period approve error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify the rep — failure here shouldn't block the approval itself.
    try {
      const { data: events } = await supabaseAdmin
        .from('commission_events')
        .select('commission_amount_cents')
        .eq('sales_rep_id', sales_rep_id)
        .eq('payout_period_start', period_start)
        .in('event_type', ['payment', 'adjustment'])
        .in('status', ['matched', 'reviewed'])

      const totalCents = (events || []).reduce((sum, e) => sum + (e.commission_amount_cents || 0), 0)

      const { data: rep } = await supabaseAdmin
        .from('sales_reps')
        .select('name, email')
        .eq('id', sales_rep_id)
        .single()

      if (rep?.email) {
        await transporter.sendMail({
          from: `"RespondPal" <${process.env.GMAIL_USER}>`,
          to: rep.email,
          subject: `Commission approved — $${(totalCents / 100).toFixed(2)}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
              <h2 style="color:#15803d;margin-bottom:4px">Your commission has been approved</h2>
              <p>Hi ${rep.name?.split(' ')[0] || ''},</p>
              <p>Your payout for <b>${period_start} to ${period_end}</b> has been reviewed and approved —
              <b>$${(totalCents / 100).toFixed(2)}</b> total, scheduled to be paid <b>${payout_date}</b>.</p>
              <p>See the full breakdown anytime: <a href="https://www.respondpal.ai/sales/commissions" style="color:#C2410C;font-weight:600;">My Commissions →</a></p>
              <p>— Jacob</p>
            </div>
          `,
        })
      }
    } catch (mailErr) {
      console.error('Approve — notification email error:', mailErr)
    }

    return NextResponse.json({ period: data })
  } catch (err) {
    console.error('Payout period approve error:', err)
    return NextResponse.json({ error: 'Failed to approve period.' }, { status: 500 })
  }
}
