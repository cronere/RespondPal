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
// full Reputation Risk Audit. Creates an "audit" (the same record type the
// public /audit funnel creates, so it shows up in the exact same admin
// queue) AND links it to a lead in the rep's own pipeline — either an
// existing one they pick, or a brand new one created automatically, same
// pattern as Response Examples. Full HIPAA judgment stays entirely with
// Jacob; the rep's job ends at "here's the business, please review it."
//
// Submitting this also logs a real contact activity on the lead and starts
// the 90-day ownership clock — requesting an audit is a genuine outreach
// action, the same as any other logged contact.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const body = await req.json()
    let lead = null

    if (body.lead_id) {
      const { data: existingLead, error: leadFetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', body.lead_id)
        .single()

      if (leadFetchError || !existingLead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
      }
      if (existingLead.sales_rep_id !== repId) {
        return NextResponse.json({ error: 'This lead belongs to another rep.' }, { status: 403 })
      }
      lead = existingLead
    } else if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    // Source of truth is the lead record when one was selected — same
    // reasoning as Response Examples, avoids the demo/lead and audit/lead
    // ever disagreeing with each other.
    const businessName = lead ? lead.business_name : body.business_name.trim()
    const contactName = lead ? lead.contact_name : ((body.contact_name || '').trim() || null)
    const contactEmail = lead ? lead.contact_email : ((body.contact_email || '').trim() || null)
    const contactPhone = lead ? lead.contact_phone : ((body.contact_phone || '').trim() || null)
    const industry = lead ? lead.industry : ((body.industry || '').trim() || null)
    const googleUrl = lead ? lead.google_url : ((body.google_url || '').trim() || null)
    const yelpUrl = lead ? lead.yelp_url : ((body.yelp_url || '').trim() || null)
    const notes = lead ? lead.notes : ((body.notes || '').trim() || null)

    const { data: rep } = await supabase
      .from('sales_reps')
      .select('name, email')
      .eq('id', repId)
      .single()
    const repName = rep?.name || 'Unknown rep'

    // Create the audit record — same shape as the public intake, plus
    // sales_rep_id for attribution.
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        business_name: businessName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        industry,
        source: 'sales_rep',
        google_url: googleUrl,
        yelp_url: yelpUrl,
        internal_notes: notes,
        status: 'new',
        sales_rep_id: repId,
      })
      .select()
      .single()

    if (auditError) {
      console.error('Sales audit-request insert error:', auditError)
      return NextResponse.json({ error: auditError.message }, { status: 500 })
    }

    // Link back to the lead — update the existing one, or create a brand
    // new one now that an audit exists to attach it to.
    const now = new Date().toISOString()
    let leadId = lead?.id
    try {
      if (lead) {
        await supabase
          .from('leads')
          .update({ linked_audit_id: audit.id, stage: 'response_sent', updated_at: now })
          .eq('id', lead.id)
      } else {
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            sales_rep_id: repId,
            original_sales_rep_id: repId,
            business_name: businessName,
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            industry,
            google_url: googleUrl,
            yelp_url: yelpUrl,
            notes,
            stage: 'response_sent',
            linked_audit_id: audit.id,
          })
          .select('id')
          .single()
        if (leadError) throw leadError
        leadId = newLead?.id
      }

      // Log this submission as a real contact activity — requesting an
      // audit is genuine outreach, the same as a phone call or email. This
      // is what actually starts the 90-day ownership clock (which keys off
      // last_contacted_at, not just record creation).
      if (leadId) {
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          sales_rep_id: repId,
          note: `Requested a Reputation Risk Audit for ${businessName}.`,
        })
        await supabase
          .from('leads')
          .update({ last_contacted_at: now })
          .eq('id', leadId)
      }
    } catch (linkErr) {
      // The audit itself already saved successfully — a failed lead-link
      // or activity-log step shouldn't block that, just log it.
      console.error('Sales audit-request lead link/activity error:', linkErr)
    }

    // Notify the team — same info as the public intake, plus which rep.
    const teamEmail = process.env.JACOB_EMAIL || 'team@respondpal.ai'
    try {
      await transporter.sendMail({
        from: `"RespondPal" <${process.env.GMAIL_USER}>`,
        to: teamEmail,
        replyTo: contactEmail || undefined,
        subject: `New audit request via ${repName}: ${businessName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
            <h2 style="color:#C2410C;margin-bottom:4px">New audit request — submitted by ${escapeHtml(repName)}</h2>
            <hr style="border:none;border-top:1px solid #e3e6eb">
            <p><strong>Business:</strong> ${escapeHtml(businessName)}</p>
            <p><strong>Contact:</strong> ${escapeHtml(contactName) || '<em>not provided</em>'}</p>
            <p><strong>Email:</strong> ${escapeHtml(contactEmail) || '<em>not provided</em>'}</p>
            <p><strong>Phone:</strong> ${escapeHtml(contactPhone) || '<em>not provided</em>'}</p>
            <p><strong>Industry:</strong> ${escapeHtml(industry) || '<em>not specified</em>'}</p>
            <p><strong>Google Maps:</strong> ${googleUrl ? `<a href="${escapeHtml(googleUrl)}">${escapeHtml(googleUrl)}</a>` : '<em>not provided</em>'}</p>
            <p><strong>Yelp:</strong> ${yelpUrl ? `<a href="${escapeHtml(yelpUrl)}">${escapeHtml(yelpUrl)}</a>` : '<em>not provided</em>'}</p>
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
