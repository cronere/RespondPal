import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

// Deliberately used sparingly — only for failures nobody is actively
// watching in real time when they happen. A signature-verification
// failure on the Stripe webhook isn't alerted here (that's expected noise
// from retries or scanning); a genuine processing failure on a correctly
// signed event is, since that means real commission data may have been
// lost silently. Same reasoning for a failed commission calculation — an
// admin action that fails shows the error directly in the UI already and
// doesn't need a duplicate alert; something failing inside the webhook,
// with nobody watching, does.
export async function alertJacob(subject, details) {
  try {
    await transporter.sendMail({
      from: `"RespondPal Alerts" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🚨 RespondPal Alert: ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#b23b30;padding:1rem 1.5rem;border-radius:8px 8px 0 0;">
            <p style="color:#ffffff;font-weight:700;font-size:0.95rem;margin:0;">🚨 ${subject}</p>
          </div>
          <div style="background:#fef2f2;padding:1rem 1.5rem;border:1px solid #fca5a5;border-top:none;border-radius:0 0 8px 8px;">
            <pre style="white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:0.8rem;color:#7f1d1d;margin:0;">${details}</pre>
          </div>
        </div>
      `,
    })
  } catch (err) {
    // If the alert itself fails to send, there's nowhere further to
    // escalate to — just log it, and never let an alert failure become a
    // secondary failure on top of whatever was already breaking.
    console.error('alertJacob failed to send:', err)
  }
}
