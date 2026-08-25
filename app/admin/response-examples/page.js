'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ResponseExamplesPage() {
  const [demos, setDemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/admin/response-demos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.demos) setDemos(d.demos)
        else setError(d.error || 'Failed to load.')
        setLoading(false)
      })
      .catch(() => { setError('Failed to load.'); setLoading(false) })
  }

  useEffect(load, [])

  const onCreated = (demo) => {
    setDemos((prev) => [demo, ...prev])
    setAdding(false)
  }

  const del = async (id) => {
    if (!confirm('Delete this response example?')) return
    await fetch(`/api/admin/response-demos/${id}`, { method: 'DELETE' })
    setDemos((prev) => prev.filter((d) => d.id !== id))
  }

  const filteredDemos = demos.filter((d) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (d.business_name || '').toLowerCase().includes(q)
  })

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head admin-page-head-row">
        <div>
          <h1>Response Examples</h1>
          <p className="admin-page-sub">
            Showcase what RespondPal would write — for prospects with unanswered reviews, especially
            healthcare businesses staying silent out of HIPAA concern.
          </p>
        </div>
        <button className="drawer-btn-primary" onClick={() => setAdding(true)}>
          + New Example Set
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {demos.length > 0 && (
        <input
          className="clients-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name…"
          style={{ marginBottom: '1rem' }}
        />
      )}

      {loading ? (
        <p className="admin-loading">Loading…</p>
      ) : demos.length === 0 ? (
        <div className="admin-empty">
          No response examples yet. Click &quot;+ New Example Set&quot; to build one for a prospect.
        </div>
      ) : filteredDemos.length === 0 ? (
        <div className="admin-empty">No response examples match &quot;{search}&quot;.</div>
      ) : (
        <div className="demo-list">
          {filteredDemos.map((d) => (
            <div className="response-demo-card" key={d.id}>
              <div className="demo-card-main">
                <div className="demo-card-name">{d.business_name}</div>
                <div className="demo-card-meta">
                  {(d.reviews || []).length} review{(d.reviews || []).length === 1 ? '' : 's'}
                  {' · '}
                  {(d.reviews || []).filter((r) => r.draft_response).length} drafted
                  {' · '}
                  <span className={`demo-status demo-status-${d.status}`}>{d.status}</span>
                </div>
              </div>
              <div className="demo-card-actions">
                <Link href={`/admin/response-examples/${d.id}`} className="rev-mini-btn">
                  Open
                </Link>
                {d.status === 'generated' && (
                  <Link href={`/admin/response-examples/${d.id}/report`} target="_blank" className="rev-mini-btn">
                    View Report ↗
                  </Link>
                )}
                <button className="rev-del-btn" onClick={() => del(d.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <NewDemoModal onClose={() => setAdding(false)} onCreated={onCreated} />}
    </div>
  )
}

function NewDemoModal({ onClose, onCreated }) {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [googleUrl, setGoogleUrl] = useState('')
  const [yelpUrl, setYelpUrl] = useState('')
  const [totalReviews, setTotalReviews] = useState('')
  const [responseRate, setResponseRate] = useState('')
  const [reviews, setReviews] = useState(
    Array.from({ length: 5 }, () => ({ platform: 'Google', star_rating: '', reviewer_name: '', review_text: '' }))
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const setReview = (i, field, value) => {
    setReviews((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  const handleCreate = async () => {
    if (!businessName.trim()) { setSaveError('Business name is required.'); return }
    const filledReviews = reviews.filter((r) => r.review_text.trim() || r.reviewer_name.trim())
    if (filledReviews.length === 0) { setSaveError('Add at least one review.'); return }

    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/admin/response-demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          industry,
          contact_name: contactName,
          contact_email: contactEmail,
          google_url: googleUrl,
          yelp_url: yelpUrl,
          total_reviews: totalReviews ? parseInt(totalReviews) : null,
          response_rate: responseRate ? parseFloat(responseRate) : null,
          reviews: filledReviews,
        }),
      })
      const data = await res.json()
      if (res.ok) onCreated(data.demo)
      else { setSaveError(data.error || 'Failed to create.'); setSaving(false) }
    } catch {
      setSaveError('Failed to create.'); setSaving(false)
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer drawer-wide">
        <div className="drawer-head">
          <div>
            <h2>New Response Example Set</h2>
            <p className="drawer-sub">
              Paste up to 5 real reviews from the prospect&apos;s Google or Yelp profile — ideally ones
              they haven&apos;t responded to. We&apos;ll draft a compliant example response for each.
            </p>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Business</div>
            <div className="drawer-grid">
              <Field label="Business name *">
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />
              </Field>
              <Field label="Industry" hint="e.g. Dental, Med Spa — determines HIPAA handling.">
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Dental" />
              </Field>
              <Field label="Contact name">
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </Field>
              <Field label="Contact email">
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </Field>
              <Field label="Google profile URL">
                <input value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} />
              </Field>
              <Field label="Yelp profile URL">
                <input value={yelpUrl} onChange={(e) => setYelpUrl(e.target.value)} />
              </Field>
              <Field label="Total reviews" hint="Optional — shown in the report stats bar.">
                <input type="number" value={totalReviews} onChange={(e) => setTotalReviews(e.target.value)} />
              </Field>
              <Field label="Response rate %" hint="Optional — e.g. 0 if they don't respond at all.">
                <input type="number" value={responseRate} onChange={(e) => setResponseRate(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Reviews (up to 5)</div>
            {reviews.map((r, i) => (
              <div key={i} className="demo-review-input">
                <div className="demo-review-input-head">Review {i + 1}</div>
                <div className="drawer-grid">
                  <Field label="Platform">
                    <select value={r.platform} onChange={(e) => setReview(i, 'platform', e.target.value)}>
                      <option value="Google">Google</option>
                      <option value="Yelp">Yelp</option>
                    </select>
                  </Field>
                  <Field label="Star rating">
                    <select value={r.star_rating} onChange={(e) => setReview(i, 'star_rating', e.target.value)}>
                      <option value="">—</option>
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
                    </select>
                  </Field>
                  <Field label="Reviewer name">
                    <input value={r.reviewer_name} onChange={(e) => setReview(i, 'reviewer_name', e.target.value)} />
                  </Field>
                </div>
                <Field label="Review text">
                  <textarea
                    className="rev-textarea"
                    style={{ minHeight: 70 }}
                    value={r.review_text}
                    onChange={(e) => setReview(i, 'review_text', e.target.value)}
                    placeholder="Paste the review text here…"
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <div className="drawer-foot">
          {saveError && <div className="drawer-error">{saveError}</div>}
          <button className="drawer-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="drawer-btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Create & Continue'}
          </button>
        </div>
      </div>
    </>
  )
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
