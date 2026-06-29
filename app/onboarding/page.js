'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    // Step 1 - Business basics
    owner_name: '',
    business_name: '',
    email: '',
    phone: '',
    industry: '',
    locations: '1',
    // Step 2 - Platform info
    google_profile_email: '',
    yelp_url: '',
    // Step 3 - Brand voice
    response_signer: '',
    response_tone: 'professional_friendly',
    things_to_avoid: '',
    business_tagline: '',
    additional_notes: '',
    sales_rep: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSubmitted(true)
    } catch (err) {
      console.error(err)
    }
    setSubmitting(false)
  }

  const canProceed = () => {
    if (step === 1) return form.owner_name && form.business_name && form.email && form.industry
    if (step === 2) return form.google_profile_email
    return true
  }

  if (submitted) {
    return (
      <div className="ob-wrap">
        <div className="ob-success">
          <div className="ob-success-icon">✓</div>
          <h2>You&apos;re all set.</h2>
          <p>We have everything we need to get started. Check your email for next steps on granting us access to your Google and Yelp profiles.</p>
          <p style={{ marginTop: '0.75rem', color: 'var(--muted2)', fontSize: '0.875rem' }}>
            Questions? Email <a href="mailto:jacob@respondpal.ai" style={{ color: 'var(--orange)' }}>jacob@respondpal.ai</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ob-wrap">
      {/* Header */}
      <div className="ob-header">
        <Image src="/logo-white.png" alt="RespondPal" className="ob-logo" width={180} height={36} />
        <h1>Let&apos;s get you set up.</h1>
        <p>Takes about 3 minutes. We&apos;ll use this to tailor every response to your business.</p>
      </div>

      {/* Progress */}
      <div className="ob-progress">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`ob-step ${step === s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
            <div className="ob-step-dot">{step > s ? '✓' : s}</div>
            <div className="ob-step-label">
              {s === 1 ? 'Your business' : s === 2 ? 'Your profiles' : 'Your voice'}
            </div>
          </div>
        ))}
        <div className="ob-progress-line">
          <div className="ob-progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="ob-form">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="ob-section">
            <div className="ob-section-label">Step 1 of 3 — Business basics</div>
            <div className="ob-fields">
              <div className="ob-row">
                <div className="ob-group">
                  <label>Your name <span className="req">*</span></label>
                  <input
                    name="owner_name"
                    type="text"
                    required
                    placeholder="Mike Smith"
                    value={form.owner_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="ob-group">
                  <label>Business name <span className="req">*</span></label>
                  <input
                    name="business_name"
                    type="text"
                    required
                    placeholder="Smith HVAC Services"
                    value={form.business_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="ob-row">
                <div className="ob-group">
                  <label>Email address <span className="req">*</span></label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="mike@smithhvac.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="ob-group">
                  <label>Phone number</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="ob-row">
                <div className="ob-group">
                  <label>Industry <span className="req">*</span></label>
                  <select name="industry" required value={form.industry} onChange={handleChange}>
                    <option value="">Select your industry</option>
                    <option>HVAC</option>
                    <option>Plumbing</option>
                    <option>Roofing</option>
                    <option>Electrical</option>
                    <option>Pest Control</option>
                    <option>Auto Repair</option>
                    <option>Auto Body</option>
                    <option>Dental</option>
                    <option>Med Spa / Aesthetics</option>
                    <option>Chiropractic</option>
                    <option>Veterinarian</option>
                    <option>Family Law</option>
                    <option>Personal Injury Law</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="ob-group">
                  <label>Number of locations</label>
                  <select name="locations" value={form.locations} onChange={handleChange}>
                    <option value="1">1 location</option>
                    <option value="2">2 locations</option>
                    <option value="3">3 locations</option>
                    <option value="4">4+ locations</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="ob-section">
            <div className="ob-section-label">Step 2 of 3 — Your review profiles</div>
            <div className="ob-fields">
              <div className="ob-group">
                <label>Google Business Profile email <span className="req">*</span></label>
                <p className="ob-hint">This is the Gmail address associated with your Google Business Profile — the one you use to log into Google My Business.</p>
                <input
                  name="google_profile_email"
                  type="email"
                  required
                  placeholder="mike@gmail.com"
                  value={form.google_profile_email}
                  onChange={handleChange}
                />
              </div>
              <div className="ob-group">
                <label>Yelp business page URL</label>
                <p className="ob-hint">Find your business on Yelp and paste the full URL here. Example: yelp.com/biz/smith-hvac-phoenix</p>
                <input
                  name="yelp_url"
                  type="url"
                  placeholder="https://yelp.com/biz/your-business"
                  value={form.yelp_url}
                  onChange={handleChange}
                />
              </div>

              {/* Access instructions */}
              <div className="ob-access-box">
                <div className="ob-access-title">📋 Next step: Grant us access</div>
                <p className="ob-access-sub">After you submit this form, you&apos;ll need to add us as a manager on both platforms. Here&apos;s how:</p>

                <div className="ob-access-platform">
                  <div className="ob-platform-name">🔵 Google Business Profile</div>
                  <ol className="ob-steps-list">
                    <li>Go to <strong>business.google.com</strong> and sign in</li>
                    <li>Click on your business → <strong>Settings</strong> → <strong>Managers</strong></li>
                    <li>Click <strong>Add</strong> and enter: <strong style={{color:'var(--orange)'}}>jacob@respondpal.ai</strong></li>
                    <li>Set role to <strong>Manager</strong> and click <strong>Invite</strong></li>
                  </ol>
                </div>

                <div className="ob-access-platform">
                  <div className="ob-platform-name">🔴 Yelp Business</div>
                  <ol className="ob-steps-list">
                    <li>Go to <strong>biz.yelp.com</strong> and sign in</li>
                    <li>Click <strong>Account Settings</strong> → <strong>Team Members</strong></li>
                    <li>Click <strong>Add Team Member</strong> and enter: <strong style={{color:'var(--orange)'}}>jacob@respondpal.ai</strong></li>
                    <li>Set role to <strong>Manager</strong> and click <strong>Send Invitation</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="ob-section">
            <div className="ob-section-label">Step 3 of 3 — Your brand voice</div>
            <p className="ob-step-intro">This helps us write responses that sound like they came from you — not a template.</p>
            <div className="ob-fields">
              <div className="ob-group">
                <label>How should we sign responses?</label>
                <p className="ob-hint">This appears at the end of each response. Examples: "Mike", "The Smith HVAC Team", "— Dr. Johnson"</p>
                <input
                  name="response_signer"
                  type="text"
                  placeholder="Mike or The Smith HVAC Team"
                  value={form.response_signer}
                  onChange={handleChange}
                />
              </div>
              <div className="ob-group">
                <label>Response tone</label>
                <select name="response_tone" value={form.response_tone} onChange={handleChange}>
                  <option value="professional_friendly">Professional & friendly — warm but business-appropriate</option>
                  <option value="warm_personal">Warm & personal — feels like it came directly from the owner</option>
                  <option value="formal">Formal — polished and professional</option>
                  <option value="casual">Casual — relaxed and conversational</option>
                </select>
              </div>
              <div className="ob-group">
                <label>Anything we should never say?</label>
                <p className="ob-hint">Phrases, commitments, or topics to avoid in responses. Example: "Don&apos;t mention specific pricing" or "Never say we&apos;re the cheapest"</p>
                <textarea
                  name="things_to_avoid"
                  rows={3}
                  placeholder="Don't mention specific pricing, avoid referencing competitors..."
                  value={form.things_to_avoid}
                  onChange={handleChange}
                />
              </div>
              <div className="ob-group">
                <label>Business tagline or any phrase you love using</label>
                <p className="ob-hint">Optional. If you have a motto or phrase we should weave in occasionally.</p>
                <input
                  name="business_tagline"
                  type="text"
                  placeholder="Honest work at a fair price"
                  value={form.business_tagline}
                  onChange={handleChange}
                />
              </div>
              <div className="ob-group">
                <label>Anything else we should know?</label>
                <textarea
                  name="additional_notes"
                  rows={3}
                  placeholder="We specialize in commercial HVAC, we have a sister location in Scottsdale, we offer a senior discount..."
                  value={form.additional_notes}
                  onChange={handleChange}
                />
              </div>
              <div className="ob-group">
                <label>Sales representative</label>
                <p className="ob-hint">If a RespondPal representative helped you sign up, enter their name here so we can credit them.</p>
                <input
                  name="sales_rep"
                  type="text"
                  placeholder="Rep's full name"
                  value={form.sales_rep}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="ob-nav">
          {step > 1 && (
            <button type="button" className="ob-btn-back" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="ob-btn-next"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue →
            </button>
          ) : (
            <button type="submit" className="ob-btn-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Complete setup →'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
