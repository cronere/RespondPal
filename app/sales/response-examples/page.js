'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function emptyReview() {
  return { platform: 'Google', star_rating: 5, reviewer_name: '', review_text: '' }
}

export default function SalesResponseExamples() {
  const [demos, setDemos] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('existing') // 'existing' or 'new'
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [form, setForm] = useState({
    business_name: '', industry: '', contact_name: '', contact_email: '',
    google_url: '', yelp_url: '',
  })
  const [reviews, setReviews] = useState([emptyReview()])

  const load = async () => {
    setLoading(true)
    try {
      const [demosRes, leadsRes] = await Promise.all([
        fetch('/api/sales/response-examples'),
        fetch('/api/sales/leads'),
      ])
      const demosData = await demosRes.json()
      if (demosRes.ok) setDemos(demosData.demos || [])
      const leadsData = await leadsRes.json()
      if (leadsRes.ok) setLeads(leadsData.leads || [])
    } catch {
      setError('Failed to load response examples.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))
  const setReview = (i, field, value) => {
    setReviews((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }
  const addReviewRow = () => { if (reviews.length < 5) setReviews((prev) => [...prev, emptyReview()]) }
  const removeReviewRow = (i) => setReviews((prev) => prev.filter((_, idx) => idx !== i))

  const openAdd = () => {
    setForm({ business_name: '', industry: '', contact_name: '', contact_email: '', google_url: '', yelp_url: '' })
    setReviews([emptyReview()])
    setSelectedLeadId('')
    setMode(leads.length > 0 ? 'existing' : 'new')
    setError('')
    setShowAdd(true)
  }

  const create = async () => {
    if (mode === 'existing' && !selectedLeadId) return
    if (mode === 'new' && !form.business_name.trim()) return
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const payload = mode === 'existing'
        ? { lead_id: selectedLeadId, reviews: reviews.filter((r) => r.review_text.trim()) }
        : { ...form, reviews: reviews.filter((r) => r.review_text.trim()) }

      const res = await fetch('/api/sales/response-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setShowAdd(false)
        load()
      } else {
        setError(data.error || 'Failed to create.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Response Examples</h1>
        <p className="admin-page-sub">
          For non-healthcare leads — a quick, real proof-of-quality PDF you can send showing exactly
          how we'd respond to their actual reviews. No compliance review needed here; healthcare
          leads go through Request an Audit instead.
        </p>
        <button className="rev-ai-btn" onClick={() => (showAdd ? setShowAdd(false) : openAdd())} style={{ marginTop: '1rem' }}>
          {showAdd ? 'Cancel' : '+ New Response Example'}
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {/* Converted from a popup drawer to an inline section, matching the
          contained pattern used on the onboarding page — the popup
          version was overflowing the viewport on mobile. */}
      {showAdd && (
        <div className="drawer-section" style={{ maxWidth: 620, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="drawer-section">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={mode === 'existing' ? 'rev-ai-btn' : 'rev-mini-btn'}
                onClick={() => setMode('existing')}
                disabled={leads.length === 0}
              >
                Pick an existing lead
              </button>
              <button
                type="button"
                className={mode === 'new' ? 'rev-ai-btn' : 'rev-mini-btn'}
                onClick={() => setMode('new')}
              >
                + New business
              </button>
            </div>

            {mode === 'existing' ? (
              leads.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  No leads yet — add one in My Leads first, or switch to &quot;New business&quot; and
                  it&apos;ll be added to your leads automatically.
                </p>
              ) : (
                <label className="field">
                  <span className="field-label">Which lead is this for? *</span>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
                  >
                    <option value="">Select a lead…</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.business_name}{l.industry ? ` (${l.industry})` : ''}</option>
                    ))}
                  </select>
                </label>
              )
            ) : (
              <>
                <label className="field">
                  <span className="field-label">Business name *</span>
                  <input value={form.business_name} onChange={(e) => setField('business_name', e.target.value)} placeholder="e.g. Joe's Auto Shop" />
                </label>
                <div className="drawer-grid">
                  <label className="field">
                    <span className="field-label">Industry</span>
                    <input value={form.industry} onChange={(e) => setField('industry', e.target.value)} placeholder="e.g. Auto Repair, Restaurant" />
                  </label>
                  <label className="field">
                    <span className="field-label">Contact name</span>
                    <input value={form.contact_name} onChange={(e) => setField('contact_name', e.target.value)} />
                  </label>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '-0.3rem' }}>
                  This will also be added to your leads automatically.
                </p>
              </>
            )}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Real reviews (up to 5)</div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              Paste 2-3 of their actual Google reviews — a mix of star ratings works best to show range.
            </p>
            {reviews.map((r, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', marginBottom: '0.6rem' }}>
                <div className="drawer-grid" style={{ marginBottom: '0.5rem' }}>
                  <label className="field" style={{ marginBottom: 0 }}>
                    <span className="field-label">Reviewer name</span>
                    <input value={r.reviewer_name} onChange={(e) => setReview(i, 'reviewer_name', e.target.value)} />
                  </label>
                  <label className="field" style={{ marginBottom: 0 }}>
                    <span className="field-label">Stars</span>
                    <select
                      value={r.star_rating}
                      onChange={(e) => setReview(i, 'star_rating', parseInt(e.target.value))}
                      style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }}
                    >
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
                    </select>
                  </label>
                </div>
                <textarea
                  value={r.review_text}
                  onChange={(e) => setReview(i, 'review_text', e.target.value)}
                  placeholder="Paste the review text here…"
                  style={{ minHeight: 60, width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '0.9rem', color: '#1a1a1a' }}
                />
                {reviews.length > 1 && (
                  <button className="rev-mini-btn" onClick={() => removeReviewRow(i)} style={{ marginTop: '0.5rem' }}>Remove</button>
                )}
              </div>
            ))}
            {reviews.length < 5 && (
              <button className="rev-mini-btn" onClick={addReviewRow}>+ Add another review</button>
            )}
          </div>

          <button
            className="rev-ai-btn"
            onClick={create}
            disabled={saving || (mode === 'existing' ? !selectedLeadId : !form.business_name.trim())}
            style={{ marginTop: '0.5rem' }}
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : demos.length === 0 ? (
        <p className="admin-page-sub">None yet. Create your first one above.</p>
      ) : (
        <div className="demo-list">
          {demos.map((d) => (
            <Link href={`/sales/response-examples/${d.id}`} key={d.id} style={{ textDecoration: 'none' }}>
              <div className="response-demo-card">
                <div>
                  <div className="demo-card-name">{d.business_name}</div>
                  <div className="demo-card-meta">
                    {d.industry || 'Industry not set'} · {(d.reviews || []).length} review{(d.reviews || []).length === 1 ? '' : 's'}
                  </div>
                </div>
                <div className={`demo-status ${d.status === 'generated' ? 'demo-status-generated' : 'demo-status-draft'}`}>
                  {d.status === 'generated' ? 'Generated' : 'Draft'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
