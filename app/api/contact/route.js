import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, business, email, phone, interest } = body

    if (!name || !business || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Email to Jacob
    await transporter.sendMail({
      from: `"RespondPal" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `New RespondPal inquiry — ${business}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e8e8e8; padding: 2rem; border-radius: 12px;">
          <h2 style="color: #ffffff; font-size: 1.4rem; margin: 0 0 1.5rem;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 0.85rem; width: 140px;">Name</td>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 0.85rem;">Business</td>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${business}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 0.85rem;">Email</td>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #FF5C1A;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 0.85rem;">Phone</td>
              <td style="padding: 0.75rem 0; border-bottom: 1px solid #2a2a2a; color: #e8e8e8;">${phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 0; color: #888; font-size: 0.85rem;">Interested in</td>
              <td style="padding: 0.75rem 0; color: #e8e8e8;">${interest}</td>
            </tr>
          </table>
        </div>
      `,
    })

    // Auto-reply to prospect
    await transporter.sendMail({
      from: `"Jacob at RespondPal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Got it, ${name.split(' ')[0]} — we'll be in touch shortly`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e8e8e8; padding: 2rem; border-radius: 12px;">
          <h2 style="color: #ffffff; font-size: 1.3rem; margin: 0 0 1rem;">Thanks for reaching out.</h2>
          <p style="color: #888; line-height: 1.7; margin: 0 0 1rem;">Hi ${name.split(' ')[0]},</p>
          <p style="color: #888; line-height: 1.7; margin: 0 0 1rem;">
            I received your inquiry for <strong style="color: #e8e8e8;">${business}</strong> and will be in touch within one business day.
          </p>
          <p style="color: #888; line-height: 1.7; margin: 0 0 2rem;">Feel free to reply to this email with any questions.</p>
          <div style="border-top: 1px solid #2a2a2a; padding-top: 1.5rem;">
            <p style="color: #555; font-size: 0.85rem; margin: 0;">
              Jacob Merkley<br />RespondPal<br />
              <a href="https://respondpal.ai" style="color: #FF5C1A;">respondpal.ai</a>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
