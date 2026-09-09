'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ResponseExampleDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReview, setNewReview] = useState({ reviewer_name: '', platform: 'Google', star_rating: 5, review_text: '' })

  // Same two flagged states the report page excludes — kept in sync here
  // so a flagged response is actually visible on the one page the report's
  // warning banner tells you to go fix it on.
  const FLAGGED_STATES = ['blocked_needs_human_review', 'concedes_fault_needs_review']
  const flagLabel = (flag) => flag === 'blocked_needs_human_review'
    ? 'Flagged — HIPAA compliance'
    : 'Flagged — concedes fault or liability in writing'

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/sales/response-examples/${id}`)
      const data = await res.json()
      if (res.ok) {
        setDemo(data.demo)
      } else {
        setError(data.error || 'Failed to load.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const deleteDemo = async () => {
    if (!confirm(`Delete this Response Examples PDF for ${demo.business_name}? This can't be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/sales/response-examples/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/sales/response-examples')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to delete.')
        setDeleting(false)
      }
    } catch {
      setError('Something went wrong.')
      setDeleting(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    setError('')
    setWarning('')
    try {
      const res = await fetch(`/api/sales/response-examples/${id}/generate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setDemo(data.demo)
        if (data.warning) setWarning(data.warning)
      } else {
        setError(data.error || 'Failed to generate.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setGenerating(false)
  }

  const copyDraft = (text, i) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(i)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const patchReviews = async (updatedReviews, onSuccess, editedIndex) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/sales/response-examples/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: updatedReviews,
          ...(Number.isInteger(editedIndex) ? { editedIndex } : {}),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setDemo(data.demo)
        if (onSuccess) onSuccess()
      } else {
        setError(data.error || 'Failed to save.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  const startEdit = (i) => {
    setEditingIdx(i)
    setEditDraft(reviews[i].draft_response || '')
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setEditDraft('')
  }

  const saveEdit = () => {
    // The saved text is sent with complianceFlag optimistically cleared,
    // but that's not the real answer — editedIndex tells the server which
    // review this is, and the server re-runs the same compliance/
    // fault-concession checks on the new text before actually saving,
    // overwriting this optimistic value with whatever it finds. A human
    // editing doesn't mean the edit is automatically clean; it means this
    // text now gets the same scrutiny a fresh AI draft already gets.
    const updated = reviews.map((r, i) =>
      i === editingIdx ? { ...r, draft_response: editDraft, complianceFlag: null } : r
    )
    patchReviews(updated, () => { setEditingIdx(null); setEditDraft('') }, editingIdx)
  }

  const deleteReview = (i) => {
    if (!confirm('Remove this review from the report? This can\'t be undone.')) return
    const updated = reviews.filter((_, idx) => idx !== i)
    patchReviews(updated)
  }

  const addReview = () => {
    if (!newReview.review_text.trim()) {
      setError('Review text is required.')
      return
    }
    const updated = [...reviews, {
      reviewer_name: newReview.reviewer_name.trim() || 'Anonymous',
      platform: newReview.platform,
      star_rating: parseInt(newReview.star_rating) || 5,
      review_text: newReview.review_text.trim(),
      draft_response: null,
      complianceFlag: null,
    }]
    patchReviews(updated, () => {
      setShowAddForm(false)
      setNewReview({ reviewer_name: '', platform: 'Google', star_rating: 5, review_text: '' })
    })
  }

  if (loading) return <div className="admin-page"><p className="admin-page-sub">Loading…</p></div>
  if (error && !demo) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error}</div>
        <button className="rev-mini-btn" onClick={() => router.push('/sales/response-examples')} style={{ marginTop: '1rem' }}>← Back</button>
      </div>
    )
  }
  if (!demo) return null

  const reviews = demo.reviews || []
  const anyGenerated = reviews.some((r) => r.draft_response)

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="rev-mini-btn" onClick={() => router.push('/sales/response-examples')}>← Back to Response Examples</button>
        <button
          onClick={deleteDemo}
          disabled={deleting}
          style={{ background: 'none', border: 'none', color: '#b23b30', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
        >
          {deleting ? 'Deleting…' : 'Delete & Start Over'}
        </button>
      </div>

      <header className="admin-page-head">
        <h1>{demo.business_name}</h1>
        <p className="admin-page-sub">{demo.industry || 'Industry not set'} · {reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
          <button className="rev-ai-btn" onClick={generate} disabled={generating}>
            {generating ? 'Generating…' : anyGenerated ? 'Generate Remaining' : 'Generate Responses'}
          </button>
          {anyGenerated && (
            <a href={`/sales/response-examples/${id}/report`} target="_blank" rel="noreferrer" className="rev-mini-btn">
              View Report / Download PDF →
            </a>
          )}
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {warning && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem', color: '#92400E' }}>
          {warning}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reviews.map((r, i) => {
          const isFlagged = FLAGGED_STATES.includes(r.complianceFlag)
          return (
            <div key={i} style={{ border: isFlagged ? '1px solid #FCA5A5' : '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                <div style={{ fontWeight: 700, color: '#1a1a1a' }}>
                  {r.reviewer_name || 'Anonymous'} · {r.platform} · {'★'.repeat(r.star_rating || 5)}
                </div>
                <button
                  onClick={() => deleteReview(i)}
                  disabled={saving}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '0.9rem', fontStyle: 'italic' }}>
                &ldquo;{r.review_text}&rdquo;
              </p>

              {isFlagged && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0.7rem 0.9rem', marginBottom: '0.7rem', fontSize: '0.82rem', color: '#B91C1C', fontWeight: 600 }}>
                  ⚠️ {flagLabel(r.complianceFlag)} — this response is excluded from the report until
                  you edit and save it below.
                </div>
              )}

              {editingIdx === i ? (
                <div style={{ background: '#F9FAFB', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.9rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Editing response
                  </div>
                  <textarea
                    className="rev-textarea"
                    style={{ minHeight: 100, width: '100%' }}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="rev-mini-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    <button className="rev-ai-btn" onClick={saveEdit} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : r.draft_response ? (
                <div style={{ background: isFlagged ? '#FEF2F2' : '#F0FDF4', border: isFlagged ? '1px solid #FCA5A5' : '1px solid #86EFAC', borderRadius: 8, padding: '0.9rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isFlagged ? '#B91C1C' : '#15803d', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    How we'd respond
                  </div>
                  <p style={{ color: '#1a1a1a', fontSize: '0.9rem', marginBottom: '0.6rem' }}>{r.draft_response}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="rev-mini-btn" onClick={() => startEdit(i)}>Edit</button>
                    <button className="rev-mini-btn" onClick={() => copyDraft(r.draft_response, i)}>
                      {copiedIdx === i ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Not generated yet.</p>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {!showAddForm ? (
          <button className="rev-mini-btn" onClick={() => setShowAddForm(true)}>+ Add a Review</button>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', background: '#fafafa' }}>
            <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>Add a review</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <label>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Reviewer name</div>
                <input
                  value={newReview.reviewer_name}
                  onChange={(e) => setNewReview((f) => ({ ...f, reviewer_name: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                />
              </label>
              <label>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Platform</div>
                <select
                  value={newReview.platform}
                  onChange={(e) => setNewReview((f) => ({ ...f, platform: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  <option value="Google">Google</option>
                  <option value="Yelp">Yelp</option>
                </select>
              </label>
              <label>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Star rating</div>
                <select
                  value={newReview.star_rating}
                  onChange={(e) => setNewReview((f) => ({ ...f, star_rating: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Review text</div>
              <textarea
                className="rev-textarea"
                style={{ minHeight: 80, width: '100%' }}
                value={newReview.review_text}
                onChange={(e) => setNewReview((f) => ({ ...f, review_text: e.target.value }))}
                placeholder="Paste the actual review text here"
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              No response yet — use Generate Remaining above once it&apos;s added to draft one, or write
              it directly by clicking Edit on the new card below.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="rev-mini-btn" onClick={() => setShowAddForm(false)} disabled={saving}>Cancel</button>
              <button className="rev-ai-btn" onClick={addReview} disabled={saving}>
                {saving ? 'Adding…' : 'Add Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
