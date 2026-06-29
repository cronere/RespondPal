import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Personal "from" for go-live emails. Defaults to jacob@ for the personal
// touch; replyTo ensures responses reach Jacob regardless of the auth mailbox.
const JACOB_FROM = process.env.JACOB_EMAIL || 'jacob@respondpal.ai'

function liveEmailHtml(firstName) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #4a4a4a; border: 1px solid #dde2e8; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e2a44; padding: 1.75rem 2rem;">
        <div style="font-size: 1.4rem; font-weight: 800; color: #ffffff;">Respond<span style="color: #E8772E;">Pal</span></div>
      </div>
      <div style="padding: 2rem;">
        <h2 style="color: #1e2a44; font-size: 1.4rem; margin: 0 0 1rem;">You're live, ${firstName}.</h2>
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1rem; font-size: 0.95rem;">
          Thank you for your trust. Everything is set up exactly as promised, and we're now monitoring your Google and Yelp profiles.
        </p>
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1rem; font-size: 0.95rem;">
          From here on, every new review you receive gets a thoughtful, on-brand response within 24 hours — without you lifting a finger. You can get back to running your business; your reputation is in good hands.
        </p>
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1.5rem; font-size: 0.95rem;">
          If you ever want to adjust how we respond, or you spot a review you'd like handled a certain way, just reply to this email — it comes straight to me.
        </p>
        <div style="border-top: 1px solid #dde2e8; padding-top: 1.25rem;">
          <p style="color: #6b7280; font-size: 0.85rem; margin: 0; line-height: 1.6;">
            Jacob Merkley<br />Founder, RespondPal<br />
            <a href="https://respondpal.ai" style="color: #C2410C;">respondpal.ai</a>
          </p>
        </div>
      </div>
    </div>
  `
}

function cleanupEmailHtml(firstName) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #4a4a4a; border: 1px solid #dde2e8; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e2a44; padding: 1.75rem 2rem;">
        <div style="font-size: 1.4rem; font-weight: 800; color: #ffffff;">Respond<span style="color: #E8772E;">Pal</span></div>
      </div>
      <div style="padding: 2rem;">
        <h2 style="color: #1e2a44; font-size: 1.4rem; margin: 0 0 1rem;">We're starting your Profile Cleanup.</h2>
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1rem; font-size: 0.95rem;">
          Hi ${firstName} — one more thing now that you're live. Since you added the Profile Cleanup, we're beginning work on your backlog: we'll respond to your unanswered reviews from the last six months so your whole profile looks active and managed, not just going forward.
        </p>
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1.5rem; font-size: 0.95rem;">
          This typically takes about five business days. We'll work through them carefully, with the same tone and care as your ongoing responses. No action needed on your end — I just wanted you to know it's underway.
        </p>
        <div style="border-top: 1px solid #dde2e8; padding-top: 1.25rem;">
          <p style="color: #6b7280; font-size: 0.85rem; margin: 0; line-height: 1.6;">
            Jacob Merkley<br />Founder, RespondPal<br />
            <a href="https://respondpal.ai" style="color: #C2410C;">respondpal.ai</a>
          </p>
        </div>
      </div>
    </div>
  `
}

// POST /api/admin/clients/[id]/go-live
export async function POST(req, { params }) {
  try {
    const { id } = params

    // Load the client
    const { data: client, error: loadError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (loadError || !client) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 })
    }

    const firstName = (client.owner_name || '').split(' ')[0] || 'there'
    const hasCleanup =
      client.plan === 'monthly_plus_cleanup' || client.plan === 'cleanup_only'

    // Update the client record: mark live
    const updates = {
      status: 'active',
      google_access: true,
      yelp_access: true,
      live_date: client.live_date || new Date().toISOString(),
      live_email_sent: true,
    }
    if (hasCleanup && client.cleanup_status === 'not_started') {
      updates.cleanup_status = 'in_progress'
    }
    if (hasCleanup) {
      updates.cleanup_email_sent = true
    }

    const emailResults = { live: false, cleanup: false }
    const emailErrors = []

    // Send "you're live" email (guard against double-send)
    if (!client.live_email_sent) {
      try {
        await transporter.sendMail({
          from: `"Jacob at RespondPal" <${process.env.GMAIL_USER}>`,
          replyTo: JACOB_FROM,
          to: client.email,
          subject: `You're live, ${firstName} — RespondPal is now handling your reviews`,
          html: liveEmailHtml(firstName),
        })
        emailResults.live = true
      } catch (err) {
        emailErrors.push('live email failed: ' + err.message)
        updates.live_email_sent = false // allow retry
      }
    }

    // Send cleanup email if applicable (guard against double-send)
    if (hasCleanup && !client.cleanup_email_sent) {
      try {
        await transporter.sendMail({
          from: `"Jacob at RespondPal" <${process.env.GMAIL_USER}>`,
          replyTo: JACOB_FROM,
          to: client.email,
          subject: `Starting your Profile Cleanup — RespondPal`,
          html: cleanupEmailHtml(firstName),
        })
        emailResults.cleanup = true
      } catch (err) {
        emailErrors.push('cleanup email failed: ' + err.message)
        updates.cleanup_email_sent = false // allow retry
      }
    }

    // Persist updates
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Client updated emails sent but DB save failed: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      client: updated,
      emails: emailResults,
      emailErrors: emailErrors.length ? emailErrors : undefined,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Go-live failed: ' + err.message }, { status: 500 })
  }
}
