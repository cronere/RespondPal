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
      owner_name,
      business_name,
      email,
      phone,
      industry,
      locations,
      google_profile_email,
      yelp_url,
      response_signer,
      response_tone,
      things_to_avoid,
      business_tagline,
      additional_notes,
      sales_rep,
    } = body

    if (!owner_name || !business_name || !email || !google_profile_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── 1. Save to Supabase ──────────────────────────────────────
    const { data: client, error: dbError } = await supabase
      .from('clients')
      .insert({
        owner_name,
        business_name,
        email,
        phone,
        industry,
        locations: parseInt(locations) || 1,
        google_profile_email,
        yelp_url,
        response_signer,
        response_tone,
        things_to_avoid,
        business_tagline,
        notes: additional_notes,
        rep_name: sales_rep,
        status: 'onboarding',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Supabase error:', dbError)
      // Don't fail the whole request if DB insert fails
      // Still send emails
    }

    // ── 2. Internal notification to Jacob ────────────────────────
    await transporter.sendMail({
      from: `"RespondPal" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `✅ Onboarding complete — ${business_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; background: #0a0a0a; color: #e8e8e8; padding: 2rem; border-radius: 12px;">
          <div style="margin-bottom: 1rem;">
            <span style="background: #22c55e; color: white; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.75rem; border-radius: 100px;">Onboarding Complete</span>
          </div>
          <h2 style="color: #fff; margin: 0 0 1.5rem;">${business_name} is ready to go live</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; width: 180px; font-size:0.85rem;">Sales Rep (commission)</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #FF5C1A; font-weight:700;">${sales_rep || '⚠ NONE ENTERED'}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; width: 180px; font-size:0.85rem;">Owner</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${owner_name}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Email</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #FF5C1A;">${email}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Phone</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Industry</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${industry}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Locations</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${locations}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">GBP Email</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${google_profile_email}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Yelp URL</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${yelp_url || 'Not provided'}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Signs responses as</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${response_signer || 'Not specified'}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Tone</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${response_tone}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Avoid</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${things_to_avoid || 'Nothing specified'}</td></tr>
            <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size:0.85rem;">Tagline</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${business_tagline || 'None'}</td></tr>
            <tr><td style="padding: 0.6rem 0; color: #888; font-size:0.85rem;">Notes</td><td style="padding: 0.6rem 0; color: #e8e8e8;">${additional_notes || 'None'}</td></tr>
          </table>
          <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,92,26,0.1); border: 1px solid rgba(255,92,26,0.3); border-radius: 8px;">
            <p style="color: #FF5C1A; font-weight: 700; font-size: 0.875rem; margin: 0 0 0.5rem;">⚡ Action required</p>
            <p style="color: #888; font-size: 0.85rem; margin: 0;">Accept the Google Manager invitation and Yelp Team Member invitation, then send the "You're Live" email once the first response is posted.</p>
          </div>
        </div>
      `,
    })

    // ── 3. Confirmation email to client ──────────────────────────
    await transporter.sendMail({
      from: `"RespondPal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${owner_name.split(' ')[0]}, your RespondPal setup is complete`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; background: #0a0a0a; color: #e8e8e8; padding: 2rem; border-radius: 12px;">
          <h2 style="color: #fff; margin: 0 0 1rem;">Almost live — one quick step left.</h2>
          <p style="color: #888; line-height: 1.7; margin: 0 0 1rem;">Hi ${owner_name.split(' ')[0]},</p>
          <p style="color: #888; line-height: 1.7; margin: 0 0 1.5rem;">
            Thanks for completing your setup. We have everything we need to start responding to your reviews. There&apos;s just one step left — granting us access to your Google and Yelp profiles.
          </p>

          <div style="background: #141414; border: 1px solid #2a2a2a; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <p style="color: #fff; font-weight: 700; margin: 0 0 1rem;">🔵 Google Business Profile</p>
            <ol style="color: #888; font-size: 0.875rem; line-height: 2; margin: 0; padding-left: 1.25rem;">
              <li>Go to <a href="https://business.google.com" style="color: #FF5C1A;">business.google.com</a> and sign in</li>
              <li>Click your business → Settings → Managers</li>
              <li>Click Add and enter <strong style="color: #fff;">team@respondpal.ai</strong></li>
              <li>Set role to Manager and click Invite</li>
            </ol>
          </div>

          <div style="background: #141414; border: 1px solid #2a2a2a; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <p style="color: #fff; font-weight: 700; margin: 0 0 1rem;">🔴 Yelp Business</p>
            <ol style="color: #888; font-size: 0.875rem; line-height: 2; margin: 0; padding-left: 1.25rem;">
              <li>Go to <a href="https://biz.yelp.com" style="color: #FF5C1A;">biz.yelp.com</a> and sign in</li>
              <li>Click Account Settings → Team Members</li>
              <li>Click Add Team Member and enter <strong style="color: #fff;">team@respondpal.ai</strong></li>
              <li>Set role to Manager and click Send Invitation</li>
            </ol>
          </div>

          <p style="color: #888; line-height: 1.7; margin: 0 0 1.5rem;">
            Once we receive both invitations we&apos;ll get everything configured and send you a confirmation that we&apos;re live. This typically takes less than 24 hours.
          </p>

          <div style="background: #141414; border: 1px solid #2a2a2a; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <p style="color: #888; font-size: 0.8rem; line-height: 1.65; margin: 0;">
              <strong style="color: #fff;">A quick note on billing:</strong> RespondPal is billed monthly, in advance. You can cancel anytime — there&apos;s no contract. If you cancel, we keep your reviews handled through the end of the month you&apos;ve already paid for, and you simply won&apos;t be charged again. See our <a href="https://respondpal.ai/terms" style="color: #FF5C1A;">Terms of Service</a> for details.
            </p>
          </div>

          <div style="border-top: 1px solid #2a2a2a; padding-top: 1.5rem;">
            <p style="color: #555; font-size: 0.85rem; margin: 0;">
              The RespondPal Team<br />
              <a href="mailto:team@respondpal.ai" style="color: #FF5C1A;">team@respondpal.ai</a><br />
              <a href="https://respondpal.ai" style="color: #FF5C1A;">respondpal.ai</a>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
