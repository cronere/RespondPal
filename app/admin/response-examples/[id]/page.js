'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ResponseDemoDetail() {
  const { id } = useParams()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [regeneratingIdx, setRegeneratingIdx] = useState(null)
  const [msg, setMsg] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsDraft, setDetailsDraft] = useState({})
  const [savingDetails, setSavingDetails] = useState(false)

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

  // The bulk "Generate Responses" button (above) deliberately SKIPS any
  // review that already has a draft_response, to avoid re-spending API calls
  // on drafts that already look fine. That's the right default — but it
  // means once every review has SOME draft, clicking that button again is a
  // silent no-op, which is confusing when the underlying drafting logic has
  // since improved and you specifically want a fresh attempt. This function
  // is the fix: clear just this one review's draft first, then call the
  // same generate endpoint — which will now see it as empty and regenerate
  // ONLY this review, leaving every other saved draft untouched.
  const regenerateOne = async (idx) => {
    setRegeneratingIdx(idx); setMsg('')
    try {
      const clearedReviews = demo.reviews.map((r, i) =>
        i === idx ? { ...r, draft_response: null, complianceFlag: null } : r
      )
      const clearRes = await fetch(`/api/admin/response-demos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: clearedReviews }),
      })
      if (!clearRes.ok) { setMsg('Failed to clear the old draft.'); setRegeneratingIdx(null); return }

      const genRes = await fetch(`/api/admin/response-demos/${id}/generate`, { method: 'POST' })
      const genData = await genRes.json()
      if (genRes.ok) {
        setDemo(genData.demo)
        const diag = (genData._diagnostics || [])[0]
        if (diag) {
          setMsg(`Regenerated. DIAGNOSTIC — isHipaaDetected: ${diag.isHipaaDetected}, complianceFlag: ${diag.complianceFlag}, blockedHits: [${diag.blockedHits.join(', ')}], faultHits: [${diag.faultHits.join(', ')}]`)
        } else {
          setMsg('Regenerated — a fresh draft was created for this review only.')
        }
      } else {
        setMsg(genData.error || 'Failed to regenerate.')
      }
    } catch {
      setMsg('Failed to regenerate.')
    }
    setRegeneratingIdx(null)
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

  // Closes a real gap: there was previously NO way to fix the industry field
  // (or any other detail) after a demo was created — if it was left blank or
  // mistyped, the entire compliance system silently never activates, with no
  // path to correct it except deleting and recreating the whole demo.
  const startEditDetails = () => {
    setDetailsDraft({
      business_name: demo.business_name || '',
      industry: demo.industry || '',
      contact_name: demo.contact_name || '',
      contact_email: demo.contact_email || '',
      google_url: demo.google_url || '',
      yelp_url: demo.yelp_url || '',
      total_reviews: demo.total_reviews ?? '',
      response_rate: demo.response_rate ?? '',
    })
    setEditingDetails(true)
  }

  const saveDetails = async () => {
    setSavingDetails(true)
    const res = await fetch(`/api/admin/response-demos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...detailsDraft,
        total_reviews: detailsDraft.total_reviews === '' ? null : parseInt(detailsDraft.total_reviews),
        response_rate: detailsDraft.response_rate === '' ? null : parseFloat(detailsDraft.response_rate),
      }),
    })
    const data = await res.json()
    if (res.ok) { setDemo(data.demo); setMsg('Business details saved.') }
    setEditingDetails(false); setSavingDetails(false)
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
          <button className="rev-mini-btn" onClick={startEditDetails}>Edit Details</button>
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

      {!demo.industry && (
        <div className="admin-warning-banner">
          ⚠️ <b>No industry set for this business.</b> Without it, our system can&apos;t detect this as a
          healthcare business — which means every response generated so far has skipped ALL compliance
          protections entirely (no HIPAA rules, no second review, no blocklist). Click &quot;Edit Details&quot;
          above, set the industry (e.g. &quot;Dental,&quot; &quot;Endodontics,&quot; &quot;Med Spa&quot;), save,
          then regenerate every response on this page — none of the current drafts were checked for compliance.
        </div>
      )}

      {editingDetails && (
        <div className="drawer-section" style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
          <div className="drawer-section-label">Business details</div>
          <div className="drawer-grid">
            <label className="field">
              <span className="field-label">Business name</span>
              <input value={detailsDraft.business_name} onChange={(e) => setDetailsDraft((d) => ({ ...d, business_name: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Industry</span>
              <input
                value={detailsDraft.industry}
                onChange={(e) => setDetailsDraft((d) => ({ ...d, industry: e.target.value }))}
                placeholder="Dental, Med Spa, Chiropractic, etc."
              />
              <span className="field-hint">This is what determines whether HIPAA protections activate — get it right.</span>
            </label>
            <label className="field">
              <span className="field-label">Contact name</span>
              <input value={detailsDraft.contact_name} onChange={(e) => setDetailsDraft((d) => ({ ...d, contact_name: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Contact email</span>
              <input value={detailsDraft.contact_email} onChange={(e) => setDetailsDraft((d) => ({ ...d, contact_email: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Google URL</span>
              <input value={detailsDraft.google_url} onChange={(e) => setDetailsDraft((d) => ({ ...d, google_url: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Yelp URL</span>
              <input value={detailsDraft.yelp_url} onChange={(e) => setDetailsDraft((d) => ({ ...d, yelp_url: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Total reviews</span>
              <input type="number" value={detailsDraft.total_reviews} onChange={(e) => setDetailsDraft((d) => ({ ...d, total_reviews: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Response rate %</span>
              <input type="number" value={detailsDraft.response_rate} onChange={(e) => setDetailsDraft((d) => ({ ...d, response_rate: e.target.value }))} />
            </label>
          </div>
          <div className="rev-draft-actions">
            <button className="rev-mini-btn" onClick={() => setEditingDetails(false)} disabled={savingDetails}>Cancel</button>
            <button className="rev-ai-btn" onClick={saveDetails} disabled={savingDetails}>
              {savingDetails ? 'Saving…' : 'Save Details'}
            </button>
          </div>
        </div>
      )}

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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="rev-mini-btn" onClick={() => startEdit(i)}>Edit</button>
                    <button
                      className="rev-mini-btn"
                      onClick={() => regenerateOne(i)}
                      disabled={regeneratingIdx === i}
                      title="Discards this draft and generates a fresh one — use this after a compliance fix, since 'Generate Responses' above skips reviews that already have any draft."
                    >
                      {regeneratingIdx === i ? 'Regenerating…' : '↻ Regenerate'}
                    </button>
                  </div>
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
