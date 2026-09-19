'use client'

import { useState, useRef } from 'react'

// Bulk trigger-letter tool. Deliberately reuses the two existing endpoints
// the one-at-a-time flow already uses (POST /api/admin/response-demos to
// create, POST .../generate to draft) rather than a new combined endpoint —
// same drafting pipeline, same compliance checks, zero new backend risk.
// Creates response_demos directly; never touches leads at all, on purpose.
//
// Paste format: one business per line, TAB-separated (copy cells directly
// out of Excel/Sheets — that's what a multi-cell copy actually puts on the
// clipboard, and it sidesteps the "review text has a comma in it" problem
// a CSV parser would otherwise have to handle).
// Columns, in order: Business Name, Industry, Reviewer Name, Platform,
// Star Rating, Review Text. Industry and Star Rating may be left blank.

function possessive(name) {
  if (!name) return name
  return /s$/i.test(name) ? `${name}'` : `${name}'s`
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length < 4) return `(${digits}`
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const MAX_REVIEW_CHARS = 380
function trimReview(text) {
  if (!text || text.length <= MAX_REVIEW_CHARS) return { text, trimmed: false }
  const cut = text.slice(0, MAX_REVIEW_CHARS).replace(/\s+\S*$/, '')
  return { text: cut + '…', trimmed: true }
}

// Simple tab-separated parse — no quote-handling needed since a tab
// essentially never appears inside pasted review text, unlike a comma.
function parseRows(raw) {
  return raw
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cols = line.split('\t')
      return {
        business_name: (cols[0] || '').trim(),
        industry: (cols[1] || '').trim(),
        reviewer_name: (cols[2] || '').trim(),
        platform: (cols[3] || '').trim() || 'Google',
        star_rating: cols[4] ? parseInt(cols[4], 10) || null : null,
        review_text: (cols[5] || '').trim(),
      }
    })
}

export default function BulkMailout() {
  const [raw, setRaw] = useState('')
  const [rows, setRows] = useState([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([]) // { row, status: 'pending'|'working'|'done'|'error', demo, error }
  const [repName, setRepName] = useState('')
  const [repPhone, setRepPhone] = useState('')
  const [repEmail, setRepEmail] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const batchRef = useRef(null)

  const ensureHtml2pdf = () => {
    if (typeof window === 'undefined') return
    if (window.html2pdf) { setScriptLoaded(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }

  const loadPreview = () => {
    const parsed = parseRows(raw)
    setRows(parsed)
    setResults(parsed.map((row) => ({ row, status: 'pending', demo: null, error: null })))
    ensureHtml2pdf()
  }

  const runBatch = async () => {
    setProcessing(true)
    const next = [...results]
    for (let i = 0; i < next.length; i++) {
      if (next[i].status === 'done') continue
      next[i] = { ...next[i], status: 'working' }
      setResults([...next])
      try {
        const createRes = await fetch('/api/admin/response-demos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_name: next[i].row.business_name,
            industry: next[i].row.industry || null,
            reviews: [{
              platform: next[i].row.platform,
              star_rating: next[i].row.star_rating,
              reviewer_name: next[i].row.reviewer_name,
              review_text: next[i].row.review_text,
            }],
          }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) throw new Error(createData.error || 'Failed to create.')

        const genRes = await fetch(`/api/admin/response-demos/${createData.demo.id}/generate`, { method: 'POST' })
        const genData = await genRes.json()
        if (!genRes.ok) throw new Error(genData.error || 'Failed to draft.')

        next[i] = { ...next[i], status: 'done', demo: genData.demo }
      } catch (err) {
        next[i] = { ...next[i], status: 'error', error: err.message }
      }
      setResults([...next])
    }
    setProcessing(false)
  }

  const doneResults = results.filter((r) => r.status === 'done' && r.demo?.reviews?.[0]?.draft_response)
  const errorResults = results.filter((r) => r.status === 'error')

  const savePhoneIfChanged = async () => {
    // Best-effort only, same as the single-letter page — never blocks the
    // actual download over a failed save.
    try {
      await fetch('/api/sales/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: repPhone }),
      })
    } catch {}
  }

  const downloadAll = async () => {
    if (!batchRef.current || !window.html2pdf) return
    setDownloading(true)
    await savePhoneIfChanged()
    const opt = {
      margin: [0.6, 0.65, 0.6, 0.65],
      filename: `Mailout_Batch_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }
    window.html2pdf().set(opt).from(batchRef.current).save().then(() => setDownloading(false)).catch(() => setDownloading(false))
  }

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head">
        <h1>Bulk Mailout</h1>
        <p className="admin-page-sub">
          Paste rows copied straight from a spreadsheet — Business Name, Industry, Reviewer Name, Platform,
          Star Rating, Review Text. Industry and Star Rating can be blank. Nothing here touches leads —
          each row becomes its own response example directly.
        </p>
      </header>

      <div className="drawer-section" style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
        <div className="drawer-section-label">Your sign-off (applied to every letter)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          <label className="field">
            <span className="field-label">Your name</span>
            <input value={repName} onChange={(e) => setRepName(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input value={repPhone} onChange={(e) => setRepPhone(formatPhone(e.target.value))} placeholder="(555) 555-5555" />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input value={repEmail} onChange={(e) => setRepEmail(e.target.value)} />
          </label>
        </div>

        <div className="drawer-section-label">Paste rows</div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={10}
          placeholder={'Griffin\'s Auto Repair\tAuto Repair\tMaria T.\tGoogle\t2\tFelt rushed and my concerns weren\'t taken seriously.'}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button className="rev-mini-btn" onClick={loadPreview} disabled={!raw.trim()}>Load rows</button>
          {rows.length > 0 && (
            <button className="drawer-btn-primary" onClick={runBatch} disabled={processing}>
              {processing ? 'Processing…' : `Generate ${rows.length} letter${rows.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="drawer-section" style={{ marginBottom: '1rem' }}>
          <div className="drawer-section-label">Progress — {doneResults.length}/{results.length} ready{errorResults.length > 0 ? `, ${errorResults.length} failed` : ''}</div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.85rem', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: '0.85rem' }}>
                <span>{r.row.business_name || <em>(no name)</em>}</span>
                <span style={{
                  color: r.status === 'done' ? '#15803d' : r.status === 'error' ? '#b91c1c' : r.status === 'working' ? '#C2410C' : '#9ca3af',
                  fontWeight: 600,
                }}>
                  {r.status === 'done' ? 'Ready' : r.status === 'error' ? (r.error || 'Failed') : r.status === 'working' ? 'Working…' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {doneResults.length > 0 && (
        <button
          className="print-btn"
          disabled={downloading || !scriptLoaded}
          onClick={downloadAll}
          style={{ background: '#C2410C', color: 'white', border: 'none', padding: '10px 24px', fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: 'pointer', marginBottom: '2rem' }}
        >
          {downloading ? 'Generating PDF…' : `Download all ${doneResults.length} letters as one PDF`}
        </button>
      )}

      {/* Hidden batch render — one letter per page, merged into a single PDF on download. */}
      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        <div ref={batchRef}>
          <style>{`.bulk-letter-body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; }`}</style>
          {doneResults.map((r, i) => {
            const review = r.demo.reviews[0]
            const displayedReview = trimReview(review.review_text)
            return (
              <div
                key={r.demo.id}
                className="bulk-letter-body"
                style={{ maxWidth: '7.5in', margin: '0 auto', padding: '0.6in 0.65in', pageBreakBefore: i === 0 ? 'auto' : 'always' }}
              >
                <div style={{ marginBottom: '0.4in' }}>
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ marginBottom: '0.3in' }}>
                  I noticed this review on {possessive(r.demo.business_name)} {review.platform} profile:
                </div>
                <div style={{ borderLeft: '3px solid #d1d5db', paddingLeft: '0.25in', marginBottom: '0.3in', fontStyle: 'italic' }}>
                  <div style={{ marginBottom: '0.1in', fontStyle: 'normal', fontSize: '0.95em', color: '#4b5563' }}>
                    {review.reviewer_name || 'A reviewer'}
                    {review.star_rating ? <> — {'★'.repeat(review.star_rating)} ({review.star_rating} star{review.star_rating === 1 ? '' : 's'})</> : null} on {review.platform}
                  </div>
                  &ldquo;{displayedReview.text}&rdquo;
                  {displayedReview.trimmed && (
                    <div style={{ fontStyle: 'normal', fontSize: '0.85em', color: '#6b7280', marginTop: '0.08in' }}>
                      (Full review on {review.platform})
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '0.15in' }}>Here&apos;s how I&apos;d respond:</div>
                <div style={{ borderLeft: '3px solid #d1d5db', paddingLeft: '0.25in', marginBottom: '0.35in' }}>
                  {review.draft_response}
                </div>
                <div style={{ marginBottom: '0.3in' }}>
                  If you&apos;d like, I can make sure every new review gets a thoughtful response like this one —
                  within 24 hours, every time. Your first month is free; $397/month after that, cancel anytime.
                </div>
                <div>
                  {repName}
                  <br /><strong>RespondPal</strong>
                  {repPhone && <><br />P: {repPhone}</>}
                  {repEmail && <><br />E: {repEmail}</>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
