'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function AuditThankYou() {
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    google_url: '',
    yelp_url: '',
    industry: '',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.business_name.trim()) { setError('Please enter your business name.'); return }
    if (!form.contact_email.trim()) { setError('Please enter your email so we can deliver the report.'); return }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'facebook_ad',
          promo_code: 'AUDIT47',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Something went wrong. Please email us at jacob@respondpal.ai.')
      }
    } catch {
      setError('Something went wrong. Please email us at jacob@respondpal.ai.')
    }
    setSubmitting(false)
  }

  return (
    <main>
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <a href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          </a>
        </div>
      </nav>

      <section className="hero" style={{ paddingBottom: '2rem', minHeight: 'auto' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          {!submitted ? (
            <>
              <div className="hero-eyebrow">✓ Payment received — thank you!</div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
                One quick step<br />
                <em>to get your report started.</em>
              </h1>
              <p className="hero-sub" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                Tell us about your business so we know where to look. We&apos;ll scan your
                Google and Yelp profiles and deliver your Reputation Risk Audit within 48 hours.
              </p>

              <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Business name *</label>
                  <input
                    style={inputStyle}
                    value={form.business_name}
                    onChange={e => set('business_name', e.target.value)}
                    placeholder="e.g. Mesa Dental"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Your name</label>
                    <input
                      style={inputStyle}
                      value={form.contact_name}
                      onChange={e => set('contact_name', e.target.value)}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Industry</label>
                    <input
                      style={inputStyle}
                      value={form.industry}
                      onChange={e => set('industry', e.target.value)}
                      placeholder="e.g. Dental, Veterinary"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Email (for report delivery) *</label>
                    <input
                      style={inputStyle}
                      type="email"
                      value={form.contact_email}
                      onChange={e => set('contact_email', e.target.value)}
                      placeholder="you@business.com"
                    />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Phone (optional)</label>
                    <input
                      style={inputStyle}
                      value={form.contact_phone}
                      onChange={e => set('contact_phone', e.target.value)}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Google Maps link (paste the URL to your business on Google Maps)</label>
                  <input
                    style={inputStyle}
                    value={form.google_url}
                    onChange={e => set('google_url', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Yelp page link (if you have one)</label>
                  <input
                    style={inputStyle}
                    value={form.yelp_url}
                    onChange={e => set('yelp_url', e.target.value)}
                    placeholder="https://yelp.com/biz/..."
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Anything else we should know? (optional)</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="e.g. We recently changed ownership, focus on reviews from the last year..."
                  />
                </div>

                {error && (
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-orange"
                  style={{ width: '100%', fontSize: '1.05rem', padding: '0.9rem', marginTop: '0.5rem' }}
                >
                  {submitting ? 'Submitting...' : 'Start my audit →'}
                </button>
              </form>

              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', textAlign: 'center' }}>
                Not sure where to find your Google Maps link? Search your business name on Google,
                click your listing, and copy the URL from your browser.
              </p>
            </>
          ) : (
            <>
              <div className="hero-eyebrow" style={{ fontSize: '1.1rem' }}>✓ You&apos;re all set!</div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
                Your audit is<br />
                <em>in progress.</em>
              </h1>
              <p className="hero-sub" style={{ fontSize: '1rem', maxWidth: 500 }}>
                We&apos;re scanning your Google and Yelp profiles now. Your custom
                Reputation Risk Audit report will be delivered to{' '}
                <strong style={{ color: 'white' }}>{form.contact_email}</strong>{' '}
                within 48 hours.
              </p>
              <p className="hero-sub" style={{ fontSize: '0.95rem', maxWidth: 500, marginTop: '1rem' }}>
                Questions? Reach out anytime at{' '}
                <a href="mailto:jacob@respondpal.ai" style={{ color: '#C2410C' }}>jacob@respondpal.ai</a>
              </p>
              <a
                href="/"
                className="btn-outline"
                style={{ marginTop: '1.5rem' }}
              >
                ← Back to RespondPal
              </a>
            </>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>&copy; {new Date().getFullYear()} RespondPal LLC · respondpal.ai</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="mailto:jacob@respondpal.ai">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

const fieldStyle = { marginBottom: '0.75rem' }
const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.7)',
  marginBottom: '0.3rem',
}
const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  fontSize: '0.95rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}
