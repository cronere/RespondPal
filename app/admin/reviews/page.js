'use client'

import { useState, useEffect } from 'react'

const STATUS_TABS = [
  { key: 'needs_work', label: 'Needs response' },
  { key: 'posted', label: 'Posted' },
  { key: 'skipped', label: 'Skipped' },
  { key: 'all', label: 'All' },
]

function Stars({ rating, recommendation }) {
  if (recommendation) {
    return <span className={`rev-rec rev-rec-${recommendation}`}>
      {recommendation === 'yes' ? '👍 Recommends' : '👎 Not recommended'}
    </span>
  }
  if (!rating) return <span className="rev-stars">—</span>
  return <span className={`rev-stars${rating <= 3 ? ' low' : ''}`}>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('needs_work')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [rRes, cRes] = await Promise.all([
        fetch('/api/admin/reviews', { cache: 'no-store' }),
        fetch('/api/admin/clients', { cache: 'no-store' }),
      ])
      const rData = await rRes.json()
      const cData = await cRes.json()
      if (rRes.ok) setReviews(rData.reviews)
      else setError(rData.error || 'Failed to load reviews.')
      if (cRes.ok) setClients(cData.clients)
    } catch {
      setError('Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const matchesTab = (r) => {
    if (tab === 'all') return true
    if (tab === 'posted') return r.response_status === 'posted'
    if (tab === 'skipped') return r.response_status === 'skipped'
    // needs_work = anything not posted or skipped
    return !['posted', 'skipped'].includes(r.response_status)
  }

  const filtered = reviews.filter(matchesTab)

  const counts = {
    needs_work: reviews.filter((r) => !['posted', 'skipped'].includes(r.response_status)).length,
    posted: reviews.filter((r) => r.response_status === 'posted').length,
    skipped: reviews.filter((r) => r.response_status === 'skipped').length,
    all: reviews.length,
  }

  const upsertReview = (updated) =>
    setReviews((prev) => {
      const exists = prev.some((r) => r.id === updated.id)
      return exists ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated, ...prev]
    })

  const removeReview = (id) => setReviews((prev) => prev.filter((r) => r.id !== id))

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head admin-page-head-row">
        <div>
          <h1>Reviews</h1>
          <p className="admin-page-sub">
            {loading ? 'Loading…' : `${counts.needs_work} awaiting response`}
          </p>
        </div>
        <div className="rev-head-actions">
          <button className="admin-refresh-btn" onClick={loadAll} disabled={loading}>↻ Refresh</button>
          <button className="rev-add-btn" onClick={() => setAdding(true)}>+ Add review</button>
        </div>
      </header>

      <div className="clients-filters rev-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`clients-filter${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="filter-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="clients-empty">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="clients-empty">
          {tab === 'needs_work'
            ? 'Nothing awaiting a response. Add a review or check another tab.'
            : 'No reviews in this view.'}
        </div>
      ) : (
        <div className="rev-list">
          {filtered.map((r) => (
            <ReviewCard key={r.id} review={r} onOpen={() => setSelected(r)} />
          ))}
        </div>
      )}

      {adding && (
        <AddReviewModal
          clients={clients}
          onClose={() => setAdding(false)}
          onAdded={(rev) => { upsertReview(rev); setAdding(false); setSelected(rev) }}
        />
      )}

      {selected && (
        <ReviewDrawer
          review={selected}
          onClose={() => setSelected(null)}
          onUpdate={(rev) => { upsertReview(rev); setSelected(rev) }}
          onDelete={(id) => { removeReview(id); setSelected(null) }}
        />
      )}
    </div>
  )
}

function ReviewCard({ review, onOpen }) {
  const client = review.clients || {}
  return (
    <button className="rev-card" onClick={onOpen}>
      <div className="rev-card-top">
        <span className="rev-platform">{review.platform}</span>
        <Stars rating={review.star_rating} recommendation={review.recommendation} />
        <span className={`pill rev-status-${review.response_status}`}>{review.response_status}</span>
      </div>
      <div className="rev-card-biz">{client.business_name || 'Unknown client'}</div>
      <div className="rev-card-reviewer">{review.reviewer_name || 'Anonymous'}</div>
      <p className="rev-card-text">{review.review_text || <em>No review text</em>}</p>
    </button>
  )
}

function AddReviewModal({ clients, onClose, onAdded }) {
  const [form, setForm] = useState({
    client_id: '',
    platform: 'google',
    reviewer_name: '',
    star_rating: '5',
    recommendation: '',
    review_text: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const usesStars = !['facebook'].includes(form.platform)

  const submit = async () => {
    if (!form.client_id) { setErr('Choose a client.'); return }
    setSaving(true); setErr('')
    const payload = { ...form }
    if (usesStars) { payload.recommendation = null }
    else { payload.star_rating = null; payload.recommendation = payload.recommendation || 'yes' }
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) onAdded(data.review)
      else { setErr(data.error || 'Failed to add.'); setSaving(false) }
    } catch { setErr('Failed to add.'); setSaving(false) }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <h2>Add a review</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span className="field-label">Client</span>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">Select a client…</option>
              {clients.filter((c) => c.status === 'active').map((c) => (
                <option key={c.id} value={c.id}>{c.business_name}</option>
              ))}
            </select>
          </label>
          <div className="drawer-grid">
            <label className="field">
              <span className="field-label">Platform</span>
              <select value={form.platform} onChange={(e) => set('platform', e.target.value)}>
                <option value="google">Google</option>
                <option value="yelp">Yelp</option>
                <option value="facebook">Facebook</option>
              </select>
            </label>
            {usesStars ? (
              <label className="field">
                <span className="field-label">Star rating</span>
                <select value={form.star_rating} onChange={(e) => set('star_rating', e.target.value)}>
                  {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} star{n>1?'s':''}</option>)}
                </select>
              </label>
            ) : (
              <label className="field">
                <span className="field-label">Recommendation</span>
                <select value={form.recommendation || 'yes'} onChange={(e) => set('recommendation', e.target.value)}>
                  <option value="yes">Recommends</option>
                  <option value="no">Does not recommend</option>
                </select>
              </label>
            )}
          </div>
          <label className="field">
            <span className="field-label">Reviewer name</span>
            <input value={form.reviewer_name} onChange={(e) => set('reviewer_name', e.target.value)} placeholder="e.g. Sarah M." />
          </label>
          <label className="field">
            <span className="field-label">Review text</span>
            <textarea rows={4} value={form.review_text} onChange={(e) => set('review_text', e.target.value)} placeholder="Paste the review here…" />
          </label>
          {err && <div className="drawer-error">{err}</div>}
        </div>
        <div className="modal-foot">
          <button className="drawer-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="drawer-btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Adding…' : 'Add to queue'}
          </button>
        </div>
      </div>
    </>
  )
}

function ReviewDrawer({ review, onClose, onUpdate, onDelete }) {
  const client = review.clients || {}
  const [draft, setDraft] = useState(review.response_final || review.response_draft || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const patch = async (payload, successMsg) => {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) { onUpdate(data.review); if (successMsg) setMsg(successMsg) }
      else setMsg(data.error || 'Save failed.')
    } catch { setMsg('Save failed.') }
    setSaving(false)
  }

  const saveDraft = () => patch({ response_draft: draft, response_status: 'drafted' }, 'Draft saved.')
  const markPosted = () => patch({ response_final: draft, response_status: 'posted' }, 'Marked posted.')
  const markSkipped = () => patch({ response_status: 'skipped' }, 'Skipped.')
  const reopen = () => patch({ response_status: 'drafted' }, 'Reopened.')

  const copyDraft = () => {
    navigator.clipboard?.writeText(draft)
    setMsg('Copied to clipboard.')
  }

  const del = async () => {
    if (!confirm('Delete this review from the queue?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(review.id)
    } catch {}
    setSaving(false)
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>{client.business_name || 'Review'}</h2>
            <p className="drawer-sub">
              {review.platform} · {review.reviewer_name || 'Anonymous'}
            </p>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="rev-review-block">
            <div className="rev-review-meta">
              <Stars rating={review.star_rating} recommendation={review.recommendation} />
              <span className={`pill rev-status-${review.response_status}`}>{review.response_status}</span>
            </div>
            <p className="rev-review-text">{review.review_text || <em>No review text provided.</em>}</p>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Voice guide</div>
            <div className="rev-voice">
              <div><strong>Signs as:</strong> {client.response_signer || '—'}</div>
              <div><strong>Tone:</strong> {(client.response_tone || 'professional_friendly').replace(/_/g, ' ')}</div>
              {client.things_to_avoid && <div><strong>Avoid:</strong> {client.things_to_avoid}</div>}
              {client.business_tagline && <div><strong>Tagline:</strong> {client.business_tagline}</div>}
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Your response</div>
            <textarea
              className="rev-draft"
              rows={7}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write the response here, then copy it into the platform…"
            />
            <div className="rev-draft-actions">
              <button className="rev-mini-btn" onClick={copyDraft} disabled={!draft}>Copy</button>
              <button className="rev-mini-btn" onClick={saveDraft} disabled={saving || !draft}>Save draft</button>
            </div>
          </div>

          {msg && <div className="onb-message success">{msg}</div>}
        </div>

        <div className="drawer-foot rev-foot">
          <button className="rev-del-btn" onClick={del} disabled={saving}>Delete</button>
          {review.response_status === 'posted' ? (
            <button className="drawer-btn-secondary" onClick={reopen} disabled={saving}>Reopen</button>
          ) : (
            <>
              <button className="drawer-btn-secondary" onClick={markSkipped} disabled={saving}>Skip</button>
              <button className="drawer-btn-primary" onClick={markPosted} disabled={saving || !draft}>
                Mark posted
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
