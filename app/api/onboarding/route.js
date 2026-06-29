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
      // Don't fail the whole request if DB insert fails — still send emails,
      // but loudly flag the failure in the internal notification below so the
      // record is never silently lost.
    }

    const dbFailed = Boolean(dbError)
    const dbErrorMessage = dbError ? (dbError.message || JSON.stringify(dbError)) : ''

    // ── 2. Internal notification to Jacob ────────────────────────
    await transporter.sendMail({
      from: `"RespondPal" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: dbFailed
        ? `⚠ DB INSERT FAILED — ${business_name} (NOT saved)`
        : `✅ Onboarding complete — ${business_name}`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #4a4a4a; border: 1px solid #dde2e8; border-radius: 12px; overflow: hidden;">
          ${dbFailed ? `
          <div style="background: #b23b30; padding: 1.25rem 2rem;">
            <p style="color: #ffffff; font-weight: 700; font-size: 0.95rem; margin: 0 0 0.5rem;">⚠ DATABASE INSERT FAILED — this client is NOT saved in Supabase</p>
            <p style="color: #ffe5e2; font-size: 0.8rem; margin: 0; line-height: 1.5;">Save this client's details manually. Error: ${dbErrorMessage}</p>
          </div>` : ''}
          <div style="background: #1e2a44; padding: 1.5rem 2rem;">
            <span style="background: ${dbFailed ? '#b23b30' : '#2a7a4a'}; color: #ffffff; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.75rem; border-radius: 100px;">${dbFailed ? 'Saved to email only' : 'Onboarding Complete'}</span>
            <h2 style="color: #ffffff; margin: 0.85rem 0 0; font-size: 1.3rem;">${business_name} is ready to go live</h2>
          </div>
          <div style="padding: 1.75rem 2rem;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; width: 180px; font-size:0.85rem;">Sales Rep (commission)</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #C2410C; font-weight:700;">${sales_rep || '⚠ NONE ENTERED'}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Owner</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${owner_name}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Email</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #C2410C;">${email}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Phone</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${phone || 'Not provided'}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Industry</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${industry}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Locations</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${locations}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">GBP Email</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${google_profile_email}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Yelp URL</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${yelp_url || 'Not provided'}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Signs responses as</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${response_signer || 'Not specified'}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Tone</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${response_tone}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Avoid</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${things_to_avoid || 'Nothing specified'}</td></tr>
              <tr><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size:0.85rem;">Tagline</td><td style="padding: 0.6rem 0; border-bottom: 1px solid #eef1f5; color: #1a1a1a;">${business_tagline || 'None'}</td></tr>
              <tr><td style="padding: 0.6rem 0; color: #6b7280; font-size:0.85rem;">Notes</td><td style="padding: 0.6rem 0; color: #1a1a1a;">${additional_notes || 'None'}</td></tr>
            </table>
            <div style="margin-top: 1.5rem; padding: 1rem; background: #fff5f0; border: 1px solid #f3d9cb; border-radius: 8px;">
              <p style="color: #C2410C; font-weight: 700; font-size: 0.875rem; margin: 0 0 0.5rem;">Action required</p>
              <p style="color: #6b7280; font-size: 0.85rem; margin: 0; line-height: 1.6;">Accept the Google Manager invitation and Yelp Team Member invitation, then send the &ldquo;You&apos;re Live&rdquo; email once the first response is posted.</p>
            </div>
          </div>
        </div>
      `,
    })

    // ── 3. Confirmation email to client ──────────────────────────
    await transporter.sendMail({
      from: `"RespondPal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${owner_name.split(' ')[0]}, your RespondPal setup is confirmed`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #4a4a4a; border: 1px solid #dde2e8; border-radius: 12px; overflow: hidden;">

          <div style="background: #1e2a44; padding: 1.75rem 2rem;">
            <div style="font-size: 1.4rem; font-weight: 800; color: #ffffff; letter-spacing: 0.01em;">Respond<span style="color: #E8772E;">Pal</span></div>
          </div>

          <div style="padding: 2rem;">
            <h2 style="color: #1e2a44; font-size: 1.4rem; margin: 0 0 1rem;">You&apos;re all set, ${owner_name.split(' ')[0]}.</h2>
            <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1.5rem; font-size: 0.95rem;">
              Thanks for completing your setup — we have everything we need to start responding to your reviews. The only thing left is making sure we have access to your Google and Yelp profiles. If you haven&apos;t granted access yet (or did it with your rep on the phone), here&apos;s the reference:
            </p>

            <div style="background: #f6f7f9; border: 1px solid #dde2e8; border-left: 3px solid #4285F4; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.25rem;">
              <p style="color: #1e2a44; font-weight: 700; margin: 0 0 0.85rem; font-size: 0.95rem;">Google Business Profile</p>
              <ol style="color: #4a4a4a; font-size: 0.875rem; line-height: 1.9; margin: 0; padding-left: 1.25rem;">
                <li>Go to <a href="https://business.google.com" style="color: #C2410C;">business.google.com</a> and sign in</li>
                <li>Click your business &rarr; Settings &rarr; Managers</li>
                <li>Click Add and enter <strong style="color: #1e2a44;">team@respondpal.ai</strong></li>
                <li>Set role to Manager and click Invite</li>
              </ol>
            </div>

            <div style="background: #f6f7f9; border: 1px solid #dde2e8; border-left: 3px solid #d32323; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem;">
              <p style="color: #1e2a44; font-weight: 700; margin: 0 0 0.85rem; font-size: 0.95rem;">Yelp Business</p>
              <ol style="color: #4a4a4a; font-size: 0.875rem; line-height: 1.9; margin: 0; padding-left: 1.25rem;">
                <li>Go to <a href="https://biz.yelp.com" style="color: #C2410C;">biz.yelp.com</a> and sign in</li>
                <li>Click Account Settings &rarr; Team Members</li>
                <li>Click Add Team Member and enter <strong style="color: #1e2a44;">team@respondpal.ai</strong></li>
                <li>Set role to Manager and click Send Invitation</li>
              </ol>
            </div>

            <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 1.5rem; font-size: 0.95rem;">
              Once we have access, we&apos;ll get everything configured and send you a note when we&apos;re live — typically within 24 hours. After that, every new review gets a professional response within 24 hours, and you never have to think about it again.
            </p>

            <div style="background: #f6f7f9; border: 1px solid #dde2e8; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem;">
              <p style="color: #6b7280; font-size: 0.8rem; line-height: 1.65; margin: 0;">
                <strong style="color: #1e2a44;">A quick note on billing:</strong> RespondPal is billed monthly, in advance. You can cancel anytime — there&apos;s no contract. If you cancel, we keep your reviews handled through the end of the month you&apos;ve already paid for, and you simply won&apos;t be charged again. See our <a href="https://respondpal.ai/terms" style="color: #C2410C;">Terms of Service</a> for details.
              </p>
            </div>

            <div style="border-top: 1px solid #dde2e8; padding-top: 1.25rem;">
              <p style="color: #6b7280; font-size: 0.85rem; margin: 0; line-height: 1.6;">
                The RespondPal Team<br />
                <a href="mailto:team@respondpal.ai" style="color: #C2410C;">team@respondpal.ai</a> &middot; <a href="https://respondpal.ai" style="color: #C2410C;">respondpal.ai</a>
              </p>
            </div>
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
