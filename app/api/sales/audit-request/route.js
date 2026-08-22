import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// POST /api/sales/audit-request — a rep submits a healthcare lead for a
// full Reputation Risk Audit. Creates a "lead" (their own pipeline record)
// AND an "audit" (the same record type the public /audit funnel creates,
// so it shows up in the exact same admin queue — the only difference is
// sales_rep_id is populated, which is what "Needs Work" in admin HQ keys
// off of). Full HIPAA judgment stays entirely with Jacob; the rep's job
// ends at "here's the business, please review it."
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    const { business_name, contact_name, contact_email, contact_phone, industry, google_url, yelp_url, notes } = body

    if (!business_name || !business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const { data: rep } = await supabase
      .from('sales_reps')
      .select('name, email')
      .eq('id', repId)
      .single()
    const repName = rep?.name || 'Unknown rep'

    // Create the audit record — same shape as the public intake, plus
    // sales_rep_id for attribution.
    const auditInsert = {
      business_name: business_name.trim(),
      contact_name: (contact_name || '').trim() || null,
      contact_email: (contact_email || '').trim() || null,
      contact_phone: (contact_phone || '').trim() || null,
      industry: (industry || '').trim() || null,
      source: 'sales_rep',
      google_url: (google_url || '').trim() || null,
      yelp_url: (yelp_url || '').trim() || null,
      internal_notes: (notes || '').trim() || null,
      status: 'new',
      sales_rep_id: repId,
    }
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert(auditInsert)
      .select()
      .single()

    if (auditError) {
      console.error('Sales audit-request insert error:', auditError)
      return NextResponse.json({ error: auditError.message }, { status: 500 })
    }

    // Create the matching lead in this rep's own pipeline, linked to the audit.
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        sales_rep_id: repId,
        business_name: business_name.trim(),
        contact_name: (contact_name || '').trim() || null,
        contact_email: (contact_email || '').trim() || null,
        contact_phone: (contact_phone || '').trim() || null,
        industry: (industry || '').trim() || null,
        google_url: (google_url || '').trim() || null,
        yelp_url: (yelp_url || '').trim() || null,
        notes: (notes || '').trim() || null,
        stage: 'response_sent',
        linked_audit_id: audit.id,
      })
    if (leadError) {
      // The audit is already saved and will still reach Jacob — a failed
      // lead-pipeline insert shouldn't block that, just log it.
      console.error('Sales audit-request lead insert error:', leadError)
    }

    // Notify the team — same info as the public intake, plus which rep.
    const teamEmail = process.env.JACOB_EMAIL || 'team@respondpal.ai'
    try {
      await transporter.sendMail({
        from: `"RespondPal" <${process.env.GMAIL_USER}>`,
        to: teamEmail,
        replyTo: contact_email || undefined,
        subject: `New audit request via ${repName}: ${business_name.trim()}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
            <h2 style="color:#C2410C;margin-bottom:4px">New audit request — submitted by ${escapeHtml(repName)}</h2>
            <hr style="border:none;border-top:1px solid #e3e6eb">
            <p><strong>Business:</strong> ${escapeHtml(business_name)}</p>
            <p><strong>Contact:</strong> ${escapeHtml(contact_name) || '<em>not provided</em>'}</p>
            <p><strong>Email:</strong> ${escapeHtml(contact_email) || '<em>not provided</em>'}</p>
            <p><strong>Phone:</strong> ${escapeHtml(contact_phone) || '<em>not provided</em>'}</p>
            <p><strong>Industry:</strong> ${escapeHtml(industry) || '<em>not specified</em>'}</p>
            <p><strong>Google Maps:</strong> ${google_url ? `<a href="${escapeHtml(google_url)}">${escapeHtml(google_url)}</a>` : '<em>not provided</em>'}</p>
            <p><strong>Yelp:</strong> ${yelp_url ? `<a href="${escapeHtml(yelp_url)}">${escapeHtml(yelp_url)}</a>` : '<em>not provided</em>'}</p>
            ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
            <hr style="border:none;border-top:1px solid #e3e6eb">
            <p style="color:#6b7280;font-size:13px">Shows up in admin HQ tagged "Needs Work." Run the audit, review findings, deliver within 48 hours.</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('Sales audit-request notify email error:', mailErr)
    }

    return NextResponse.json({ success: true, audit })
  } catch (err) {
    console.error('Sales audit-request error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
