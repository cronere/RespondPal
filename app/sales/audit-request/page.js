'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AuditRequest() {
  const [form, setForm] = useState({
    business_name: '', contact_name: '', contact_email: '', contact_phone: '',
    industry: '', google_url: '', yelp_url: '', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const submit = async () => {
    if (!form.business_name.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/sales/audit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(form.business_name)
        setForm({ business_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', google_url: '', yelp_url: '', notes: '' })
      } else {
        setError(data.error || 'Failed to submit audit request.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSubmitting(false)
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Request an Audit</h1>
        <p className="admin-page-sub">
          For healthcare leads only — dental, chiropractic, med spa, physical therapy, and similar.
          Jacob personally reviews every finding for HIPAA compliance before anything goes out, so
          your part ends at submitting the business — no compliance judgment calls needed on your end.
        </p>
      </header>

      {submitted && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', maxWidth: 560, color: '#166534' }}>
          <strong>Submitted — {submitted}</strong> is now in the queue and also added to your Leads
          pipeline. Jacob will review it and the report typically goes out within 48 hours.
          {' '}
          <Link href="/sales/leads" style={{ color: '#15803d', fontWeight: 700 }}>View your leads →</Link>
        </div>
      )}

      {error && <div className="admin-error">{error}</div>}

      <div className="drawer-section" style={{ maxWidth: 560 }}>
        <label className="field">
          <span className="field-label">Business name *</span>
          <input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Mesa Dental" />
        </label>

        <div className="drawer-grid">
          <label className="field">
            <span className="field-label">Contact name</span>
            <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Industry</span>
            <input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Dental, Chiropractic" />
          </label>
        </div>

        <div className="drawer-grid">
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Google Maps link</span>
          <input value={form.google_url} onChange={(e) => set('google_url', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Yelp link</span>
          <input value={form.yelp_url} onChange={(e) => set('yelp_url', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Notes</span>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ minHeight: 70 }} />
        </label>

        <button className="rev-ai-btn" onClick={submit} disabled={submitting} style={{ marginTop: '0.5rem' }}>
          {submitting ? 'Submitting…' : 'Submit Audit Request'}
        </button>
      </div>
    </div>
  )
}
