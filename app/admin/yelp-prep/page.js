'use client'

import { useState, useEffect } from 'react'

// Quick AI drafting workspace — paste any review, pick the client, generate a
// response in their voice, copy it out. Nothing is saved to the queue here;
// this is for fast one-off drafting (e.g. Yelp, where you copy into the
// platform manually). To track a review through the workflow, use Reviews.
export default function AdminYelpPrep() {
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [platform, setPlatform] = useState('yelp')
  const [rating, setRating] = useState('5')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [draft, setDraft] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/clients', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setClients((d.clients || []).filter((c) => c.status === 'active')))
      .catch(() => {})
  }, [])

  const selectedClient = clients.find((c) => c.id === clientId)

  const generate = async () => {
    if (!clientId) { setMsg('Choose a client first.'); return }
    if (!reviewText.trim()) { setMsg('Paste the review text first.'); return }
    setDrafting(true); setMsg('')
    try {
      const review = {
        platform,
        star_rating: platform === 'facebook' ? null : parseInt(rating),
        recommendation: platform === 'facebook' ? 'yes' : null,
        reviewer_name: reviewerName,
        review_text: reviewText,
      }
      const res = await fetch('/api/admin/ai-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-draft-key': process.env.NEXT_PUBLIC_DRAFT_KEY || '',
        },
        body: JSON.stringify({ review, client: selectedClient }),
      })
      const data = await res.json()
      if (res.ok) { setDraft(data.draft); setMsg('Draft ready — review, edit, then copy.') }
      else setMsg(data.error || 'Could not generate a draft.')
    } catch {
      setMsg('Could not generate a draft.')
    }
    setDrafting(false)
  }

  const copy = () => {
    navigator.clipboard?.writeText(draft)
    setMsg('Copied to clipboard.')
  }

  const clear = () => {
    setReviewText(''); setReviewerName(''); setDraft(''); setMsg('')
  }

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head">
        <h1>Quick Draft</h1>
        <p className="admin-page-sub">
          Paste any review, generate an on-brand response, copy it into the platform. Nothing is saved here — use Reviews to track a review through the workflow.
        </p>
      </header>

      <div className="qd-grid">
        <div className="qd-input-col">
          <div className="qd-card">
            <label className="field">
              <span className="field-label">Client</span>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select a client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </label>

            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Platform</span>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option value="yelp">Yelp</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                </select>
              </label>
              {platform !== 'facebook' && (
                <label className="field">
                  <span className="field-label">Star rating</span>
                  <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} star{n>1?'s':''}</option>)}
                  </select>
                </label>
              )}
            </div>

            <label className="field">
              <span className="field-label">Reviewer name (optional)</span>
              <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="e.g. Sarah M." />
            </label>

            <label className="field">
              <span className="field-label">Review text</span>
              <textarea rows={6} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Paste the review here…" />
            </label>

            {selectedClient && (
              <div className="qd-voice">
                <strong>Voice:</strong> {selectedClient.response_signer ? `signs as ${selectedClient.response_signer}, ` : ''}
                {(selectedClient.response_tone || 'professional_friendly').replace(/_/g, ' ')}
                {selectedClient.things_to_avoid ? ` · avoids: ${selectedClient.things_to_avoid}` : ''}
              </div>
            )}

            <div className="qd-actions">
              <button className="rev-mini-btn" onClick={clear}>Clear</button>
              <button className="rev-add-btn" onClick={generate} disabled={drafting}>
                {drafting ? 'Drafting…' : '✨ Generate response'}
              </button>
            </div>
          </div>
        </div>

        <div className="qd-output-col">
          <div className="qd-card qd-output">
            <div className="drawer-section-label">Generated response</div>
            <textarea
              className="rev-draft qd-draft"
              rows={10}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your AI-drafted response will appear here. You can edit it before copying."
            />
            <button className="rev-mini-btn" onClick={copy} disabled={!draft}>Copy to clipboard</button>
            {msg && <div className="qd-msg">{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
