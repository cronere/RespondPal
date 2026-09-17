'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

// The trigger-outreach tool: turns one specific review + its drafted
// response into a plain, mailable letter — not a branded sales piece.
// Deliberately unbranded on purpose: no logo, no navy header, no "AI-
// powered platform" language. The whole point, confirmed by the research
// that led to building this, is that it reads as a personal note about
// the prospect's own review, not another piece of marketing mail that
// gets tossed with the rest of the pile. A polished, on-brand version
// would defeat the actual mechanism that makes this work.
//
// Reuses response_demos entirely rather than a separate system — this is
// just a different export of the same underlying data (one review at a
// time instead of the full multi-review report), which is why it lives
// under the existing response-examples route tree rather than its own.
function TriggerLetterForm() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const [demo, setDemo] = useState(null)
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [repName, setRepName] = useState('')
  const [repPhone, setRepPhone] = useState('')
  const [repEmail, setRepEmail] = useState('')
  const letterRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2pdf) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => setScriptLoaded(true)
      document.head.appendChild(script)
    } else if (window.html2pdf) {
      setScriptLoaded(true)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [demoRes, repRes] = await Promise.all([
          fetch(`/api/sales/response-examples/${id}`),
          fetch('/api/sales/me'),
        ])
        const demoData = await demoRes.json()
        const repData = await repRes.json()

        if (demoRes.ok) setDemo(demoData.demo)
        else setError(demoData.error || 'Not found.')

        if (repRes.ok && repData.rep) {
          setRep(repData.rep)
          setRepName(repData.rep.name || '')
          setRepEmail(repData.rep.email || '')
          setRepPhone(repData.rep.phone || '')
        }
      } catch {
        setError('Failed to load.')
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  if (error || !demo) return <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{error || 'Not found.'}</div>

  const FLAGGED_STATES = ['blocked_needs_human_review', 'concedes_fault_needs_review']
  const reviews = demo.reviews || []

  // Which review to use: the ?review= index if it points at a real,
  // drafted, non-flagged review — otherwise fall back to the first
  // review that qualifies. A flagged response never reaches this page by
  // choice (the entry-point link on the detail page is hidden for
  // flagged reviews), but this is the real, server-independent guard —
  // the query param is client input and shouldn't be trusted blindly.
  const requestedIdx = parseInt(searchParams.get('review'))
  const isUsable = (r) => r && r.draft_response && !FLAGGED_STATES.includes(r.complianceFlag)
  const review = isUsable(reviews[requestedIdx]) ? reviews[requestedIdx] : reviews.find(isUsable)

  if (!review) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        No usable drafted response found for this one. Go back and generate or clear a flag first.
      </div>
    )
  }

  const savePhoneIfChanged = async () => {
    if (repPhone !== (rep?.phone || '')) {
      try {
        await fetch('/api/sales/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: repPhone }),
        })
      } catch {
        // Best-effort — saving the phone for next time should never block
        // today's actual download.
      }
    }
  }

  const downloadPdf = async () => {
    if (!letterRef.current || !window.html2pdf) return
    setGenerating(true)
    await savePhoneIfChanged()
    const filename = `${(demo.business_name || 'Letter').replace(/[^a-zA-Z0-9]/g, '_')}_Letter.pdf`
    const opt = {
      margin: [0.6, 0.65, 0.6, 0.65],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }
    window.html2pdf().set(opt).from(letterRef.current).save().then(() => setGenerating(false)).catch(() => setGenerating(false))
  }

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      <style>{`
        .letter-body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; }
        .letter-page { background: white; max-width: 7.5in; margin: 0 auto; padding: 0.6in 0.65in; }
        @media print { .no-print { display: none; } }
      `}</style>

      <div className="no-print" style={{ maxWidth: '7.5in', margin: '0 auto', padding: '1.5rem 0.65in 0.5rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '0.6rem' }}>
            Your sign-off on this letter
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
            <label className="field">
              <span className="field-label">Your name</span>
              <input value={repName} onChange={(e) => setRepName(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Phone</span>
              <input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} placeholder="(555) 555-5555" />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input value={repEmail} onChange={(e) => setRepEmail(e.target.value)} />
            </label>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', marginBottom: 0 }}>
            Your phone number is saved for next time when you download.
          </p>
        </div>
        <button className="print-btn" disabled={generating || !scriptLoaded} onClick={downloadPdf} style={{ background: '#C2410C', color: 'white', border: 'none', padding: '10px 24px', fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: 'pointer', display: 'block', margin: '0 auto 1.5rem' }}>
          {generating ? 'Generating PDF…' : scriptLoaded ? 'Download Letter PDF' : 'Loading…'}
        </button>
      </div>

      <div className="letter-page letter-body" ref={letterRef}>
        <div style={{ marginBottom: '0.4in' }}>
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <div style={{ marginBottom: '0.3in' }}>
          I noticed this review on {demo.business_name}&apos;s {review.platform} profile:
        </div>

        <div style={{ borderLeft: '3px solid #d1d5db', paddingLeft: '0.25in', marginBottom: '0.3in', fontStyle: 'italic' }}>
          <div style={{ marginBottom: '0.1in', fontStyle: 'normal', fontSize: '0.95em', color: '#4b5563' }}>
            {review.reviewer_name || 'A reviewer'} — {'★'.repeat(review.star_rating || 5)}{'☆'.repeat(5 - (review.star_rating || 5))} on {review.platform}
          </div>
          &ldquo;{review.review_text}&rdquo;
        </div>

        <div style={{ marginBottom: '0.15in' }}>Here&apos;s how I&apos;d respond:</div>

        <div style={{ borderLeft: '3px solid #d1d5db', paddingLeft: '0.25in', marginBottom: '0.35in' }}>
          {review.draft_response}
        </div>

        <div style={{ marginBottom: '0.3in' }}>
          If you&apos;d like, I can make sure every new review gets a thoughtful response like this one — within
          24 hours, every time. $397/month, cancel anytime.
        </div>

        <div>
          {repName}
          {repPhone && <><br />{repPhone}</>}
          {repEmail && <><br />{repEmail}</>}
        </div>
      </div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js App Router,
// otherwise the build warns and the route deopts to fully client-side
// rendering for the whole page rather than just this part — same pattern
// already used successfully on /onboarding and /audit/started.
export default function TriggerLetter() {
  return (
    <Suspense fallback={null}>
      <TriggerLetterForm />
    </Suspense>
  )
}
