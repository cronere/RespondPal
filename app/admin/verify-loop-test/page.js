'use client'

import { useState } from 'react'

export default function VerifyLoopTestPage() {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('Dental')
  const [starRating, setStarRating] = useState('5')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const runTest = async () => {
    if (!reviewText.trim()) { setError('Paste a review first.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/admin/verify-loop-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review: { platform: 'Google', star_rating: starRating, reviewer_name: reviewerName, review_text: reviewText },
          client: { business_name: businessName || 'Test Practice', industry, response_tone: 'professional_friendly' },
        }),
      })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.error || 'Failed to run test.')
    } catch {
      setError('Failed to run test.')
    }
    setLoading(false)
  }

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head">
        <h1>Verify-Loop Test (V1 vs V2)</h1>
        <p className="admin-page-sub">
          Isolated comparison tool — runs the same review through the current live system (V1) and the new
          experimental verify-redraft loop (V2) side by side. Doesn&apos;t touch any client data or save
          anything. Purely for evaluating whether V2 is worth adopting.
        </p>
      </header>

      <div className="drawer-section" style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="drawer-grid">
          <label className="field">
            <span className="field-label">Business name</span>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Test Practice" />
          </label>
          <label className="field">
            <span className="field-label">Industry</span>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Dental" />
            <span className="field-hint">Must match a HIPAA keyword to trigger V2&apos;s verify loop at all.</span>
          </label>
          <label className="field">
            <span className="field-label">Star rating</span>
            <select value={starRating} onChange={(e) => setStarRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Reviewer name</span>
            <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span className="field-label">Review text</span>
          <textarea
            className="rev-textarea"
            style={{ minHeight: 100 }}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Paste the review text here…"
          />
        </label>
        <div className="rev-draft-actions">
          <button className="rev-ai-btn" onClick={runTest} disabled={loading}>
            {loading ? 'Running both systems…' : 'Run Comparison'}
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <ResultColumn title="V1 — Current Live System" result={result.v1} />
          <ResultColumn title="V2 — Verify-Redraft Loop" result={result.v2} isV2 />
        </div>
      )}
    </div>
  )
}

function ResultColumn({ title, result, isV2 }) {
  const flagged = result.complianceFlag && result.complianceFlag !== 'corrected'
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: isV2 ? '#EFF6FF' : '#FFF7ED', padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>
        {title}
      </div>
      <div style={{ padding: '1rem' }}>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{result.draft}</p>

        {result.complianceFlag && (
          <div style={{
            fontSize: '0.78rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 4, display: 'inline-block',
            background: flagged ? '#FEF2F2' : '#F0FDF4', color: flagged ? '#B91C1C' : '#15803D',
          }}>
            {flagged ? `⚠️ ${result.complianceFlag}` : `✓ ${result.complianceFlag}`}
          </div>
        )}
        {!result.complianceFlag && (
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803D' }}>✓ Clean, no flags</div>
        )}

        {isV2 && result.meta && result.meta.attempts && result.meta.attempts.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Loop detail ({result.meta.attempts.length} attempt{result.meta.attempts.length === 1 ? '' : 's'})
            </div>
            {result.meta.attempts.map((a, i) => (
              <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.5rem', padding: '0.5rem', background: a.passed ? '#F0FDF4' : '#FEF2F2', borderRadius: 4 }}>
                <div style={{ fontWeight: 700 }}>Attempt {a.attemptNum}: {a.passed ? '✓ Passed' : '✗ Failed'}</div>
                {a.checkResults.filter((c) => c.violates).map((c, j) => (
                  <div key={j} style={{ marginTop: '0.25rem', color: '#991B1B' }}>
                    <b>{c.label}:</b> &ldquo;{c.quote}&rdquo; — {c.reason}
                  </div>
                ))}
                {a.blockedHits.length > 0 && (
                  <div style={{ marginTop: '0.25rem', color: '#991B1B' }}>
                    <b>Blocklist:</b> {a.blockedHits.join(', ')}
                  </div>
                )}
                {a.faultHits.length > 0 && (
                  <div style={{ marginTop: '0.25rem', color: '#991B1B' }}>
                    <b>Fault-concession:</b> {a.faultHits.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isV2 && result.meta && !result.meta.isHipaa && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>
            Non-HIPAA industry — verify loop bypassed, went straight to final draft.
          </div>
        )}
      </div>
    </div>
  )
}
