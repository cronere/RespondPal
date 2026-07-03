import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

// POST /api/audit — public intake for the Reputation Risk Audit landing page.
// Captures the lead. Does NOT run the AI scan here — that happens in the
// admin (app/admin/audits) once raw_input (their pasted responses) is
// collected, either via a follow-up email/form or a quick call.

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
      contact_name,
      contact_email,
      contact_phone,
      industry,
      source, // e.g. 'facebook_ad'
      promo_code, // e.g. 'AUDIT47'
      google_url,
      yelp_url,
      notes,
    } = body

    if (!business_name || !business_name.trim()) {
      return NextResponse.json({ error: 'Please enter your business name.' }, { status: 400 })
    }
    if (!contact_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const insert = {
      business_name: business_name.trim(),
      contact_name: (contact_name || '').trim() || null,
      contact_email: contact_email.trim(),
      contact_phone: (contact_phone || '').trim() || null,
      industry: (industry || '').trim() || null,
      source: (source || 'direct').trim(),
      promo_code: (promo_code || '').trim() || null,
      google_url: (google_url || '').trim() || null,
      yelp_url: (yelp_url || '').trim() || null,
      internal_notes: (notes || '').trim() || null,
      status: 'new',
    }

    const { data, error: dbError } = await supabase
      .from('audits')
      .insert(insert)
      .select()
      .single()

    if (dbError) {
      console.error('Audit insert error:', dbError)
      return NextResponse.json(
        { error: 'Something went wrong. Please email us directly at team@respondpal.ai.' },
        { status: 500 }
      )
    }

    // Notify the team.
    const teamEmail = process.env.JACOB_EMAIL || 'team@respondpal.ai'
    try {
      await transporter.sendMail({
        from: `"RespondPal" <${process.env.GMAIL_USER}>`,
        to: teamEmail,
        replyTo: contact_email,
        subject: `New audit request: ${business_name.trim()} (${insert.source})`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
            <h2 style="color:#C2410C;margin-bottom:4px">New Reputation Risk Audit request</h2>
            <hr style="border:none;border-top:1px solid #e3e6eb">
            <p><strong>Business:</strong> ${escapeHtml(business_name)}</p>
            <p><strong>Contact:</strong> ${escapeHtml(contact_name) || '<em>not provided</em>'}</p>
            <p><strong>Email:</strong> ${escapeHtml(contact_email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(contact_phone) || '<em>not provided</em>'}</p>
            <p><strong>Industry:</strong> ${escapeHtml(industry) || '<em>not specified</em>'}</p>
            <p><strong>Source:</strong> ${escapeHtml(insert.source)}</p>
            <p><strong>Promo code:</strong> ${escapeHtml(promo_code) || '<em>none</em>'}</p>
            <p><strong>Google Maps:</strong> ${google_url ? `<a href="${escapeHtml(google_url)}">${escapeHtml(google_url)}</a>` : '<em>not provided</em>'}</p>
            <p><strong>Yelp:</strong> ${yelp_url ? `<a href="${escapeHtml(yelp_url)}">${escapeHtml(yelp_url)}</a>` : '<em>not provided</em>'}</p>
            ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
            <hr style="border:none;border-top:1px solid #e3e6eb">
            <p style="color:#6b7280;font-size:13px">Next step: scrape their reviews via Apify, run the audit in the admin, generate the PDF, and deliver within 48 hours.</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('Audit notify email error:', mailErr)
      // DB insert already succeeded — the lead is captured either way.
    }

    // Confirmation email to the lead.
    try {
      await transporter.sendMail({
        from: `"RespondPal" <${process.env.GMAIL_USER}>`,
        to: contact_email.trim(),
        subject: `We've got your Reputation Risk Audit request`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
            <h2 style="color:#C2410C;margin-bottom:4px">Thanks, ${escapeHtml(contact_name) || 'there'}!</h2>
            <p>We received your request for a Reputation Risk Audit for <strong>${escapeHtml(business_name)}</strong>.</p>
            <p>Next step: reply to this email with a few screenshots (or copy/paste) of your existing Google and Yelp review responses — the ones you or your team have already posted. We'll scan them for red flags and send back a full report within 2 business days.</p>
            <p>No login access needed. Just the text of your existing responses.</p>
            <p style="margin-top:24px">Talk soon,<br>The RespondPal Team</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('Audit confirmation email error:', mailErr)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Audit route error:', err)
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
