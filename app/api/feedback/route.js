import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      business_name,
      contact_email,
      feedback_type, // 'change_request' | 'general_guidance'
      review_reference,
      requested_change,
      guidance,
    } = body

    if (!business_name || !business_name.trim()) {
      return NextResponse.json({ error: 'Please enter your business name.' }, { status: 400 })
    }

    const type = feedback_type === 'general_guidance' ? 'general_guidance' : 'change_request'

    if (type === 'change_request' && !(requested_change || '').trim()) {
      return NextResponse.json(
        { error: 'Please tell us what you’d like changed.' },
        { status: 400 }
      )
    }
    if (type === 'general_guidance' && !(guidance || '').trim()) {
      return NextResponse.json(
        { error: 'Please share your guidance for future responses.' },
        { status: 400 }
      )
    }

    // Try to match this submission to a known client (by email first, then name).
    let client_id = null
    let matchedClientName = null
    try {
      let match = null
      if (contact_email && contact_email.trim()) {
        const { data } = await supabase
          .from('clients')
          .select('id, business_name')
          .ilike('email', contact_email.trim())
          .maybeSingle()
        match = data
      }
      if (!match && business_name) {
        const { data } = await supabase
          .from('clients')
          .select('id, business_name')
          .ilike('business_name', business_name.trim())
          .maybeSingle()
        match = data
      }
      if (match) {
        client_id = match.id
        matchedClientName = match.business_name
      }
    } catch {
      // Matching is best-effort; never block a submission on it.
    }

    const insert = {
      client_id,
      business_name: business_name.trim(),
      contact_email: (contact_email || '').trim() || null,
      feedback_type: type,
      review_reference: (review_reference || '').trim() || null,
      requested_change: type === 'change_request' ? (requested_change || '').trim() : null,
      guidance: type === 'general_guidance' ? (guidance || '').trim() : null,
      status: 'new',
    }

    const { error: dbError } = await supabase.from('feedback').insert(insert)
    if (dbError) {
      console.error('Feedback insert error:', dbError)
      // Still try to email so the request isn't lost.
    }

    // Notify Jacob.
    const jacobEmail = process.env.JACOB_EMAIL || 'jacob@respondpal.ai'
    const typeLabel = type === 'change_request' ? 'Change request' : 'General guidance'
    const matchLine = client_id
      ? `Matched to client: ${matchedClientName}`
      : 'No client match found (review manually).'

    const detailsHtml =
      type === 'change_request'
        ? `<p><strong>Which response:</strong> ${escapeHtml(review_reference) || '<em>not specified</em>'}</p>
           <p><strong>Requested change:</strong><br>${escapeHtml(requested_change)}</p>`
        : `<p><strong>Guidance for future responses:</strong><br>${escapeHtml(guidance)}</p>`

    try {
      await transporter.sendMail({
        from: `"RespondPal" <${process.env.GMAIL_USER}>`,
        to: jacobEmail,
        replyTo: contact_email || undefined,
        subject: `Client feedback: ${typeLabel} — ${business_name.trim()}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
            <h2 style="color:#C2410C;margin-bottom:4px">New client feedback</h2>
            <p style="color:#6b7280;margin-top:0">${typeLabel}</p>
            <hr style="border:none;border-top:1px solid #e3e6eb">
            <p><strong>Business:</strong> ${escapeHtml(business_name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(contact_email) || '<em>not provided</em>'}</p>
            <p style="color:#6b7280;font-size:13px">${matchLine}</p>
            <hr style="border:none;border-top:1px solid #e3e6eb">
            ${detailsHtml}
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('Feedback email error:', mailErr)
      // If the DB save worked, the feedback is still captured in the admin.
      if (dbError) {
        return NextResponse.json(
          { error: 'Something went wrong. Please email us directly at team@respondpal.ai.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback route error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}
