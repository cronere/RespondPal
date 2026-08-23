'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ResponseExampleDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)

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
      <button className="rev-mini-btn" onClick={() => router.push('/sales/response-examples')} style={{ marginBottom: '1rem' }}>← Back to Response Examples</button>

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
        {reviews.map((r, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', background: 'white' }}>
            <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.2rem' }}>
              {r.reviewer_name || 'Anonymous'} · {r.platform} · {'★'.repeat(r.star_rating || 5)}
            </div>
            <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '0.9rem', fontStyle: 'italic' }}>
              &ldquo;{r.review_text}&rdquo;
            </p>
            {r.draft_response ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '0.9rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  How we'd respond
                </div>
                <p style={{ color: '#1a1a1a', fontSize: '0.9rem', marginBottom: '0.6rem' }}>{r.draft_response}</p>
                <button className="rev-mini-btn" onClick={() => copyDraft(r.draft_response, i)}>
                  {copiedIdx === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Not generated yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
