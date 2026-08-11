'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ResponseDemoDetail() {
  const { id } = useParams()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/response-demos/${id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.demo) setDemo(d.demo); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [id])

  const generate = async () => {
    setGenerating(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/response-demos/${id}/generate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setDemo(data.demo)
        setMsg(data.warning || 'Responses generated — review each before sending.')
      } else {
        setMsg(data.error || 'Failed to generate.')
      }
    } catch {
      setMsg('Failed to generate.')
    }
    setGenerating(false)
  }

  const startEdit = (idx) => {
    setEditingIdx(idx)
    setEditDraft(demo.reviews[idx].draft_response || '')
  }

  const saveEdit = async () => {
    setSaving(true)
    const updatedReviews = demo.reviews.map((r, i) =>
      i === editingIdx ? { ...r, draft_response: editDraft, complianceFlag: null } : r
    )
    const res = await fetch(`/api/admin/response-demos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews: updatedReviews }),
    })
    const data = await res.json()
    if (res.ok) { setDemo(data.demo); setMsg('Saved.') }
    setEditingIdx(null); setSaving(false)
  }

  if (loading) return <div className="admin-page"><p className="admin-loading">Loading…</p></div>
  if (!demo) return <div className="admin-page"><p className="admin-error">Not found.</p></div>

  const anyDrafted = demo.reviews.some((r) => r.draft_response)
  const FLAGGED_STATES = ['blocked_needs_human_review', 'concedes_fault_needs_review']
  const anyFlagged = demo.reviews.some((r) => FLAGGED_STATES.includes(r.complianceFlag))

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head admin-page-head-row">
        <div>
          <Link href="/admin/response-examples" className="admin-back-link">← Response Examples</Link>
          <h1>{demo.business_name}</h1>
          <p className="admin-page-sub">
            {demo.reviews.length} review{demo.reviews.length === 1 ? '' : 's'} · {demo.industry || 'Industry not set'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="drawer-btn-primary" onClick={generate} disabled={generating}>
            {generating ? 'Generating…' : anyDrafted ? '↻ Generate Remaining' : 'Generate Responses'}
          </button>
          {demo.status === 'generated' && (
            <Link href={`/admin/response-examples/${id}/report`} target="_blank" className="drawer-btn-secondary">
              View Report ↗
            </Link>
          )}
        </div>
      </header>

      {msg && <div className="admin-msg">{msg}</div>}
      {anyFlagged && (
        <div className="admin-warning-banner">
          ⚠️ One or more responses were flagged by the compliance scan after both AI passes. Edit them
          manually before sending this to a prospect — do not use as-is.
        </div>
      )}

      <div className="demo-reviews-list">
        {demo.reviews.map((r, i) => (
          <div className="demo-review-card" key={i}>
            <div className="demo-review-card-head">
              <span className="demo-review-platform">{r.platform}</span>
              <span className="demo-review-stars">{'★'.repeat(parseInt(r.star_rating) || 0)}{'☆'.repeat(5 - (parseInt(r.star_rating) || 0))}</span>
              <span className="demo-review-name">{r.reviewer_name || 'Anonymous'}</span>
              {r.complianceFlag === 'blocked_needs_human_review' && (
                <span className="demo-flag-badge">⚠️ Compliance review needed</span>
              )}
              {r.complianceFlag === 'concedes_fault_needs_review' && (
                <span className="demo-flag-badge">⚠️ Concedes fault</span>
              )}
            </div>
            <p className="demo-review-text">&ldquo;{r.review_text}&rdquo;</p>

            {r.draft_response ? (
              editingIdx === i ? (
                <div className="demo-draft-edit">
                  <textarea
                    className="rev-textarea"
                    style={{ minHeight: 100 }}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                  <div className="rev-draft-actions">
                    <button className="rev-mini-btn" onClick={() => setEditingIdx(null)} disabled={saving}>Cancel</button>
                    <button className="rev-ai-btn" onClick={saveEdit} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="demo-draft-box">
                  <div className="demo-draft-label">How we&apos;d respond</div>
                  <p>{r.draft_response}</p>
                  <button className="rev-mini-btn" onClick={() => startEdit(i)}>Edit</button>
                </div>
              )
            ) : (
              <p className="demo-draft-pending">Not drafted yet — click &quot;Generate Responses&quot; above.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
