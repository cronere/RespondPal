'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

const HIPAA_KEYWORDS = ['dental', 'dentist', 'orthodont', 'medical', 'doctor', 'physician',
  'chiropractic', 'chiropractor', 'med spa', 'medspa', 'dermatology', 'dermatologist',
  'cosmetic surg', 'plastic surg', 'optometry', 'optometrist', 'ophthalmol',
  'behavioral health', 'mental health', 'psychiatr', 'psycholog', 'therapy',
  'physical therapy', 'urgent care', 'clinic', 'healthcare', 'health care',
  'oral surg', 'periodon', 'endodont', 'pediatric', 'obgyn', 'ob-gyn',
  'aesthetic', 'esthetic', 'wellness', 'injectable', 'botox', 'filler',
  'iv therapy', 'iv hydration', 'weight loss clinic', 'hormone', 'laser clinic',
  'natural medicine', 'functional medicine', 'integrative medicine', 'naturopath',
  'acupunctur', 'nutritionist', 'dietitian', 'rehab', 'recovery center',
  'urgent', 'family practice', 'internal medicine', 'nurse practitioner', 'nurse pract']

function isHipaaIndustry(industry) {
  const ind = (industry || '').toLowerCase()
  return HIPAA_KEYWORDS.some(kw => ind.includes(kw))
}

export default function ResponseDemoReport() {
  const { id } = useParams()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const reportRef = useRef(null)

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
        const res = await fetch(`/api/admin/response-demos/${id}`)
        const data = await res.json()
        if (res.ok) setDemo(data.demo)
        else setError(data.error || 'Not found.')
      } catch {
        setError('Failed to load.')
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  if (error || !demo) return <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{error || 'Not found.'}</div>

  const isHipaa = isHipaaIndustry(demo.industry)
  const draftedReviews = (demo.reviews || []).filter((r) => r.draft_response)
  const platforms = [...new Set((demo.reviews || []).map((r) => r.platform))].join(' & ')
  const today = new Date(demo.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .report { padding: 0; }
          .page-break { page-break-before: always; }
          @page { margin: 0.5in 0.6in; }
        }
        .report {
          font-family: Helvetica, Arial, sans-serif;
          max-width: 780px;
          margin: 0 auto;
          padding: 1.5rem;
          color: #374151;
          font-size: 10pt;
          line-height: 1.5;
        }
        .top-bar { height: 6px; background: #C2410C; margin: -1.5rem -1.5rem 1.5rem -1.5rem; }
        .label { font-size: 8pt; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .title { font-size: 22pt; font-weight: 700; color: #111827; margin: 0 0 2px 0; }
        .subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 1rem; }
        .stats-bar { display: flex; background: #FFF7ED; border: 1px solid #e5e7eb; margin-bottom: 1rem; }
        .stat { flex: 1; text-align: center; padding: 10px 8px 8px; border-right: 1px solid #e5e7eb; }
        .stat:last-child { border-right: none; }
        .stat-num { font-size: 22pt; font-weight: 700; color: #111827; }
        .stat-num.orange { color: #C2410C; }
        .stat-num.green { color: #15803d; }
        .stat-label { font-size: 7.5pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
        .body { font-size: 9.5pt; color: #374151; margin-bottom: 10px; }
        h2.section-h { font-size: 13pt; font-weight: 700; color: #111827; margin: 20px 0 8px; }
        .why-box { background: #F9FAFB; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; margin: 12px 0; }
        .protect-box { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 6px; padding: 14px 16px; margin: 12px 0; }
        .protect-box h3 { font-size: 11pt; color: #15803d; margin: 0 0 8px; }
        .protect-item { display: flex; gap: 8px; margin-bottom: 6px; font-size: 9pt; color: #374151; }
        .protect-check { color: #15803d; font-weight: 700; flex-shrink: 0; }
        .review-card { border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px; overflow: hidden; page-break-inside: avoid; }
        .review-head { background: #F9FAFB; padding: 8px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #e5e7eb; }
        .review-stars { color: #F59E0B; font-size: 10pt; letter-spacing: 1px; }
        .review-platform { font-size: 7.5pt; font-weight: 700; color: #6b7280; text-transform: uppercase; background: white; border: 1px solid #e5e7eb; border-radius: 3px; padding: 1px 6px; }
        .review-name { font-size: 9pt; font-weight: 700; color: #111827; }
        .review-body { padding: 10px 12px; }
        .review-text { font-size: 9pt; color: #4b5563; font-style: italic; margin-bottom: 8px; }
        .response-box { background: #FFF7ED; border-left: 3px solid #C2410C; padding: 8px 12px; }
        .response-label { font-size: 7.5pt; font-weight: 700; color: #C2410C; text-transform: uppercase; margin-bottom: 3px; }
        .response-text { font-size: 9pt; color: #1a1a1a; }
        .cta-box { background: #111827; color: white; border-radius: 8px; padding: 20px 24px; margin-top: 20px; text-align: center; }
        .cta-head { font-size: 14pt; font-weight: 700; margin-bottom: 6px; }
        .cta-body { font-size: 9.5pt; color: #D1D5DB; margin-bottom: 12px; }
        .cta-price { font-size: 11pt; font-weight: 700; color: #FDBA74; margin-bottom: 10px; }
        .footer { font-size: 7.5pt; color: #6b7280; text-align: center; margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
        .print-btn { background: #C2410C; color: white; border: none; padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; margin: 1rem auto; display: block; }
        .print-btn:hover { background: #a3360a; }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <button className="print-btn" disabled={generating || !scriptLoaded} onClick={() => {
          if (!reportRef.current || !window.html2pdf) return
          setGenerating(true)
          const filename = `${(demo.business_name || 'Response_Examples').replace(/[^a-zA-Z0-9]/g, '_')}_Response_Examples.pdf`
          const opt = {
            margin: [0.4, 0.5, 0.4, 0.5],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          }
          window.html2pdf().set(opt).from(reportRef.current).save().then(() => setGenerating(false)).catch(() => setGenerating(false))
        }}>
          {generating ? 'Generating PDF...' : scriptLoaded ? 'Download PDF' : 'Loading...'}
        </button>
      </div>

      <div className="report" ref={reportRef}>
        <div className="top-bar" />

        <div className="label">RESPONDPAL</div>
        <h1 className="title">Response Examples</h1>
        <div className="subtitle">
          {demo.business_name}
          <br />
          {today} {platforms ? `| Platform: ${platforms}` : ''}
        </div>

        {(demo.total_reviews != null || demo.response_rate != null) && (
          <div className="stats-bar">
            {demo.total_reviews != null && (
              <div className="stat">
                <div className="stat-num">{demo.total_reviews}</div>
                <div className="stat-label">Reviews on profile</div>
              </div>
            )}
            {demo.response_rate != null && (
              <div className="stat">
                <div className="stat-num orange">{demo.response_rate}%</div>
                <div className="stat-label">Current response rate</div>
              </div>
            )}
            <div className="stat">
              <div className="stat-num green">{draftedReviews.length}</div>
              <div className="stat-label">Example responses below</div>
            </div>
          </div>
        )}

        <p className="body">
          These are real reviews currently sitting on {demo.business_name}&apos;s public profile. Below,
          you&apos;ll see exactly how RespondPal would respond to each one — drafted by our AI, calibrated
          for your industry, ready for your review before anything goes live.
        </p>

        <div className="why-box">
          <b style={{ fontSize: '9.5pt' }}>Why this matters:</b>{' '}
          <span className="body" style={{ marginBottom: 0, display: 'inline' }}>
            Google&apos;s AI Overviews, ChatGPT, and Perplexity now read review responses — not just star
            ratings — to decide whether to recommend a business. Every unanswered review is a missed
            signal to both future customers and the AI tools now influencing where they go.
          </span>
        </div>

        {isHipaa && (
          <div className="protect-box">
            <h3>How We Protect Your Practice</h3>
            <p className="body" style={{ marginBottom: 10 }}>
              Every response below was written under strict compliance rules — the same ones we&apos;d
              apply to your account every day. Specifically, our system never:
            </p>
            <div className="protect-item"><span className="protect-check">✓</span><span>Confirms or denies that a reviewer is a patient — even when they identify themselves first</span></div>
            <div className="protect-item"><span className="protect-check">✓</span><span>References specific treatment, procedure, diagnosis, or billing details tied to a reviewer</span></div>
            <div className="protect-item"><span className="protect-check">✓</span><span>Implies an ongoing or future care relationship (no &quot;see you at your next visit&quot;)</span></div>
            <div className="protect-item"><span className="protect-check">✓</span><span>Names a specific provider or staff member in connection with a reviewer&apos;s care</span></div>
            <div className="protect-item"><span className="protect-check">✓</span><span>References a records search in any direction — confirmed, denied, or otherwise</span></div>
            <p className="body" style={{ marginTop: 10, marginBottom: 0, fontSize: '8.5pt', color: '#166534' }}>
              Every response also passes through a second, independent compliance review before you ever see it —
              and a final human check before anything is posted publicly.
            </p>
          </div>
        )}

        <h2 className="section-h">Sample Responses</h2>

        {draftedReviews.length === 0 ? (
          <p className="body">No responses generated yet — go back and click &quot;Generate Responses.&quot;</p>
        ) : (
          draftedReviews.map((r, i) => {
            const stars = parseInt(r.star_rating) || 0
            return (
              <div className="review-card" key={i}>
                <div className="review-head">
                  <span className="review-platform">{r.platform}</span>
                  <span className="review-stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                  <span className="review-name">{r.reviewer_name || 'Anonymous'}</span>
                </div>
                <div className="review-body">
                  <p className="review-text">&ldquo;{r.review_text}&rdquo;</p>
                  <div className="response-box">
                    <div className="response-label">How We&apos;d Respond</div>
                    <div className="response-text">{r.draft_response}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div className="cta-box">
          <div className="cta-head">Want every future review handled like this?</div>
          <div className="cta-body">
            Every new review — Google and Yelp — drafted within hours, reviewed for compliance,
            and posted only after you&apos;re comfortable. No more choosing between staying silent
            and taking on risk.
          </div>
          <div className="cta-price">Starting at $397/month — no contract</div>
        </div>

        <div className="footer">
          RespondPal — respondpal.ai — This report was generated as a sample of our service and does not
          reflect responses currently posted to {demo.business_name}&apos;s live profile.
        </div>
      </div>
    </>
  )
}
