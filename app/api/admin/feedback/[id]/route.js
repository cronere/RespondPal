import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const EDITABLE_FIELDS = ['status', 'internal_notes']

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

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

    // Look at the current row BEFORE updating, so we can tell whether this
    // PATCH is the moment a change request transitions into "resolved".
    const { data: before } = await supabaseAdmin
      .from('feedback')
      .select('status, feedback_type, contact_email, business_name')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select('*, clients(business_name)')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send a "your change is done" email ONLY when:
    //  - this update sets status to 'resolved'
    //  - it wasn't already resolved (so we don't re-email on note saves)
    //  - it's a change_request (not general guidance)
    //  - we actually have the customer's email
    const becameResolved =
      updates.status === 'resolved' && before && before.status !== 'resolved'
    if (
      becameResolved &&
      before.feedback_type === 'change_request' &&
      before.contact_email
    ) {
      try {
        const bizName = data.clients?.business_name || before.business_name || 'there'
        await transporter.sendMail({
          from: `"RespondPal" <${process.env.GMAIL_USER}>`,
          to: before.contact_email,
          replyTo: process.env.JACOB_EMAIL || 'jacob@respondpal.ai',
          subject: 'Your review response has been updated',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;color:#1a1a1a;line-height:1.6">
              <p>Hi ${escapeHtml(bizName)},</p>
              <p>Just a quick note to let you know we&rsquo;ve taken care of the
              change you requested. The updated response is now live on your profile.</p>
              <p>If it&rsquo;s not quite right, or there&rsquo;s anything else you&rsquo;d
              like adjusted, just reply to this email or submit another request at
              <a href="https://respondpal.ai/feedback">respondpal.ai/feedback</a>.</p>
              <p>Thanks,<br>The RespondPal Team</p>
            </div>
          `,
        })
      } catch (mailErr) {
        // Don't fail the status update if the email hiccups — the change is
        // still marked resolved in HQ; the email is a courtesy on top.
        console.error('Resolved-email error:', mailErr)
      }
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

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
