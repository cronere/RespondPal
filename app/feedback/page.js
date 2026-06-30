'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Feedback() {
  const [type, setType] = useState('change_request')
  const [form, setForm] = useState({
    business_name: '',
    contact_email: '',
    review_reference: '',
    requested_change: '',
    guidance: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // After a successful submit, let the client file another without retyping
  // their business name and email. `nextType` sets which kind they're filing.
  const startAnother = (nextType) => {
    setForm((f) => ({
      ...f,
      review_reference: '',
      requested_change: '',
      guidance: '',
    }))
    setType(nextType)
    setError('')
    setDone(false)
  }

  const submit = async () => {
    setError('')
    if (!form.business_name.trim()) {
      setError('Please enter your business name.')
      return
    }
    if (type === 'change_request' && !form.requested_change.trim()) {
      setError('Please tell us what you’d like changed.')
      return
    }
    if (type === 'general_guidance' && !form.guidance.trim()) {
      setError('Please share your guidance for future responses.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, feedback_type: type }),
      })
      const data = await res.json()
      if (res.ok) setDone(true)
      else { setError(data.error || 'Something went wrong.'); setSubmitting(false) }
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="ob-wrap">
        <div className="ob-success">
          <div className="ob-success-icon">✓</div>
          <h1>Got it — thank you!</h1>
          {type === 'change_request' ? (
            <p>
              Your change request is in our hands. We&apos;ll take care of it and
              email you to confirm once it&apos;s done — usually within 24 hours.
            </p>
          ) : (
            <p>
              Thank you for the guidance. We&apos;ll fold this into how we write
              your responses going forward, so they keep sounding just right.
            </p>
          )}
          <div className="fb-again-row">
            <button className="fb-again-btn" onClick={() => startAnother('change_request')} type="button">
              Request another change
            </button>
            <button className="fb-again-btn" onClick={() => startAnother('general_guidance')} type="button">
              Add more guidance
            </button>
          </div>
          <Link href="/" className="fb-back-link">← Back to RespondPal</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="ob-wrap">
      <div className="ob-header">
        <Image src="/logo-white.png" alt="RespondPal" className="ob-logo" width={180} height={36} />
        <h1>Share feedback on your responses</h1>
        <p>
          Want us to tweak a specific response, or guide how we handle your reviews
          going forward? Tell us here — every note makes your responses better.
        </p>
      </div>

      <div className="ob-form">
        {/* Type toggle */}
        <div className="fb-toggle">
          <button
            className={`fb-toggle-btn ${type === 'change_request' ? 'active' : ''}`}
            onClick={() => setType('change_request')}
            type="button"
          >
            Change a specific response
          </button>
          <button
            className={`fb-toggle-btn ${type === 'general_guidance' ? 'active' : ''}`}
            onClick={() => setType('general_guidance')}
            type="button"
          >
            Guidance for going forward
          </button>
        </div>

        <div className="fb-card">
          <div className="ob-row">
            <div className="ob-group">
              <label>Business name <span className="req">*</span></label>
              <input
                value={form.business_name}
                onChange={(e) => set('business_name', e.target.value)}
                placeholder="Your business"
              />
            </div>
            <div className="ob-group">
              <label>Your email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
                placeholder="So we can follow up"
              />
            </div>
          </div>

          {type === 'change_request' ? (
            <>
              <div className="ob-group fb-mt">
                <label>Which response?</label>
                <input
                  value={form.review_reference}
                  onChange={(e) => set('review_reference', e.target.value)}
                  placeholder="e.g. the reply to Sarah’s 5-star Google review, or paste the review text"
                />
                <span className="fb-hint">
                  A name, the platform, the star rating, or a snippet of the review — whatever helps us find it.
                </span>
              </div>
              <div className="ob-group fb-mt">
                <label>What would you like changed? <span className="req">*</span></label>
                <textarea
                  rows={5}
                  value={form.requested_change}
                  onChange={(e) => set('requested_change', e.target.value)}
                  placeholder="Tell us what to adjust, add, or remove."
                />
              </div>
            </>
          ) : (
            <div className="ob-group fb-mt">
              <label>How should we handle your responses going forward? <span className="req">*</span></label>
              <textarea
                rows={6}
                value={form.guidance}
                onChange={(e) => set('guidance', e.target.value)}
                placeholder="e.g. Always mention our warranty on positive reviews. Keep replies short. Never offer discounts. Sign as ‘The Team at …’."
              />
              <span className="fb-hint">
                This becomes part of how we write every future response for you — the more specific, the better.
              </span>
            </div>
          )}

          {error && <div className="fb-error">{error}</div>}

          <button className="fb-submit" onClick={submit} disabled={submitting} type="button">
            {submitting ? 'Sending…' : 'Send to RespondPal'}
          </button>
        </div>

        <p className="fb-foot">
          Prefer email? Reach us anytime at{' '}
          <a href="mailto:team@respondpal.ai">team@respondpal.ai</a>.
        </p>
      </div>
    </div>
  )
}
