'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function AuditReport() {
  const { id } = useParams()
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    // Load html2pdf.js dynamically
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
        const res = await fetch(`/api/admin/audits/${id}`, { method: 'GET' })
        if (!res.ok) {
          // The PATCH route doesn't have GET — use the list route and filter
          const listRes = await fetch('/api/admin/audits')
          const data = await listRes.json()
          const found = (data.audits || []).find(a => a.id === id)
          if (found) { setAudit(found) } else { setError('Audit not found.') }
        } else {
          const data = await res.json()
          setAudit(data.audit)
        }
      } catch { setError('Failed to load audit.') }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'Helvetica, Arial, sans-serif' }}>Loading report...</div>
  if (error) return <div style={{ padding: '2rem', fontFamily: 'Helvetica, Arial, sans-serif', color: '#b91c1c' }}>{error}</div>
  if (!audit) return null

  const findings = audit.findings || []

  // Findings are stored in whatever order the AI produced them, which roughly
  // tracks the order reviews were pasted in — NOT severity. Score each finding
  // so the most damning ones surface first, rather than whichever happened to
  // be pasted first. More issue tags + certain high-impact categories rank higher.
  const impactScore = (f) => {
    const issues = (f.issues || []).map(i => i.toLowerCase())
    let score = issues.length * 10 // more simultaneous issues = more damning
    if (issues.some(i => i.includes('privacy'))) score += 15
    if (issues.some(i => i.includes('grave') || i.includes('grief'))) score += 20
    if (issues.some(i => i.includes('combative'))) score += 8
    if (issues.some(i => i.includes('billing'))) score += 5
    if (issues.some(i => i.includes('staff'))) score += 5
    if (issues.some(i => i.includes('false resolution'))) score += 5
    // Longer original_excerpt often means a more substantive, specific violation
    // rather than a one-line brush-off — small tiebreaker weight only.
    score += Math.min((f.original_excerpt || '').length / 50, 5)
    return score
  }

  const critical = findings
    .filter(f => (f.severity || '').toLowerCase() === 'critical')
    .sort((a, b) => impactScore(b) - impactScore(a))
  const moderate = findings.filter(f => (f.severity || '').toLowerCase() === 'moderate')
  const minor = findings.filter(f => (f.severity || '').toLowerCase() === 'minor')

  const gTotal = audit.total_reviews || 0
  const gResp = audit.reviews_with_responses || 0
  const gText = audit.reviews_with_text || 0
  const gNeg = audit.negative_unresponded || 0
  const yTotal = audit.yelp_total_reviews || 0
  const yResp = audit.yelp_reviews_with_responses || 0
  const yText = audit.yelp_reviews_with_text || yTotal
  const yNeg = audit.yelp_negative_unresponded || 0

  const combinedTotal = gTotal + yTotal
  const combinedResp = gResp + yResp
  const combinedNeg = gNeg + yNeg
  const combinedText = gText + yText
  const combinedRate = combinedText > 0 ? ((combinedResp / combinedText) * 100).toFixed(1) + '%' : 'N/A'

  const shown = critical.slice(0, 5)
  const overflow = critical.length - shown.length

  // Summaries are always replaced (never concatenated) as of the latest
  // analyze logic. This split/fallback only matters for older audits that
  // still have legacy "--- Batch N ---" dividers stored from before that
  // change — for those, show the LATEST segment since it's the most complete.
  const summaryParts = (audit.summary || '').split('--- Batch')
  const summary = summaryParts[summaryParts.length - 1].replace(/^\s*\d+\s*---\s*/, '').trim()

  // Pick two of the SHOWN findings (already top-5 by impact) to inline a
  // rewrite directly beneath — prefer two different categories so the pair
  // demonstrates range (e.g. one emotionally-charged clinical finding and
  // one billing/business finding) rather than two similar-sounding ones.
  const categoryOf = (f) => {
    const issues = (f.issues || []).map(i => i.toLowerCase())
    if (issues.some(i => i.includes('grave') || i.includes('grief'))) return 'grave'
    if (issues.some(i => i.includes('staff'))) return 'staff'
    if (issues.some(i => i.includes('combative'))) return 'combative'
    if (issues.some(i => i.includes('billing'))) return 'billing'
    if (issues.some(i => i.includes('false resolution'))) return 'resolution'
    return 'privacy'
  }
  const rewritableShown = shown.filter(f => f.rewrite)
  const priority = ['grave', 'combative', 'staff', 'resolution', 'privacy', 'billing']
  const inlineRewriteIds = (() => {
    if (rewritableShown.length === 0) return new Set()
    if (rewritableShown.length === 1) return new Set([shown.indexOf(rewritableShown[0])])
    const first = [...rewritableShown].sort((a, b) => priority.indexOf(categoryOf(a)) - priority.indexOf(categoryOf(b)))[0]
    const firstCat = categoryOf(first)
    const second = rewritableShown.find(f => f !== first && categoryOf(f) !== firstCat) || rewritableShown.find(f => f !== first)
    const idxs = [shown.indexOf(first)]
    if (second) idxs.push(shown.indexOf(second))
    return new Set(idxs)
  })()

  // Bold the specific violating phrase within an excerpt, if the AI provided
  // an exact substring match. Falls back to plain text if no match found.
  // Normalizes smart quotes/dashes and collapses whitespace so minor
  // formatting differences between the AI's excerpt and phrase don't cause
  // the highlight to silently fail to render at all.
  const normalizeForMatch = (s) =>
    (s || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()

  const highlightExcerpt = (text, phrase) => {
    if (!text) return null
    if (!phrase) return text
    // Try an exact match first (fast path, preserves original text exactly).
    let idx = text.indexOf(phrase)
    let matchLen = phrase.length
    if (idx === -1) {
      // Fall back to a normalized, whitespace-insensitive search so smart
      // quotes, en-dashes, or extra spacing don't cause a total miss.
      const normText = normalizeForMatch(text)
      const normPhrase = normalizeForMatch(phrase)
      if (normPhrase && normText.includes(normPhrase)) {
        // Map the match position back onto the ORIGINAL text as closely as
        // possible using a whitespace-flexible regex built from the phrase.
        const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')
        const re = new RegExp(escaped, 'i')
        const match = text.match(re)
        if (match) {
          idx = match.index
          matchLen = match[0].length
        }
      }
    }
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <b style={{ background: '#FEE2E2', padding: '0 2px' }}>{text.slice(idx, idx + matchLen)}</b>
        {text.slice(idx + matchLen)}
      </>
    )
  }

  const hasYelp = yTotal > 0
  const platforms = hasYelp ? 'Google & Yelp' : 'Google'
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const ind = (audit.industry || '').toLowerCase()
  const hipaaKeywords = ['dental', 'dentist', 'orthodont', 'medical', 'doctor', 'physician',
    'chiropractic', 'chiropractor', 'med spa', 'medspa', 'dermatology', 'dermatologist',
    'cosmetic surg', 'plastic surg', 'optometry', 'behavioral health', 'mental health',
    'urgent care', 'clinic', 'healthcare', 'health care']
  const isHipaa = hipaaKeywords.some(kw => ind.includes(kw))

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .report { padding: 0; }
          .page-break { page-break-before: always; }
          @page {
            margin: 0.5in 0.6in;
          }
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
        .logo { height: 26px; margin-bottom: 1rem; display: block; }
        .label { font-size: 8pt; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .title { font-size: 22pt; font-weight: 700; color: #111827; margin: 0 0 2px 0; }
        .subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 1rem; }
        .stats-bar { display: flex; background: #FFF7ED; border: 1px solid #e5e7eb; margin-bottom: 1rem; }
        .stat { flex: 1; text-align: center; padding: 10px 8px 8px; border-right: 1px solid #e5e7eb; }
        .stat:last-child { border-right: none; }
        .stat-num { font-size: 22pt; font-weight: 700; color: #111827; }
        .stat-num.red { color: #b91c1c; }
        .stat-num.orange { color: #C2410C; }
        .stat-label { font-size: 7.5pt; color: #6b7280; margin-top: 2px; }
        .body { font-size: 9.5pt; color: #374151; margin-bottom: 8px; }
        .platform-line { font-size: 8pt; color: #6b7280; margin-bottom: 4px; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
        .finding-wrap { margin-bottom: 8px; border: 1px solid #e5e7eb; }
        .finding { display: flex; }
        .finding-bar { width: 4px; background: #b91c1c; flex-shrink: 0; }
        .finding-content { padding: 8px 12px; flex: 1; }
        .finding-header { font-size: 9pt; font-weight: 700; margin-bottom: 4px; }
        .finding-header .crit { color: #b91c1c; }
        .finding-header .tags { color: #6b7280; font-weight: 400; font-size: 8pt; margin-left: 8px; }
        .finding-review { font-size: 8.5pt; color: #6b7280; font-style: italic; margin-bottom: 3px; }
        .finding-response { font-size: 9pt; color: #374151; margin-bottom: 0; }
        .finding-response b { color: #b91c1c; }
        .overflow { font-size: 9.5pt; font-weight: 700; color: #374151; margin: 8px 0; }
        .neg-note { font-size: 9.5pt; margin: 8px 0; }
        .neg-note b { color: #111827; }
        .example-section { margin-top: 12px; }
        .rewrite-card { display: flex; border: 1px solid #e5e7eb; margin-top: 6px; }
        .rewrite-bar { width: 4px; background: #15803d; flex-shrink: 0; }
        .rewrite-content { padding: 8px 12px; flex: 1; }
        .rewrite-label { font-size: 7.5pt; font-weight: 700; color: #15803d; text-transform: uppercase; margin-bottom: 2px; }
        .rewrite-text { font-size: 8.5pt; color: #374151; }
        .rewrite-note { font-size: 8pt; color: #6b7280; font-style: italic; margin-top: 4px; }
        .reco-section { margin-top: 1rem; }
        .reco-h2 { font-size: 15pt; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .reco-step { font-size: 9.5pt; margin-bottom: 6px; }
        .cta-box { background: #FFF7ED; border: 2px solid #C2410C; padding: 20px; text-align: center; margin: 16px 0; border-radius: 8px; }
        .cta-head { font-size: 15pt; font-weight: 700; color: #111827; margin-bottom: 6px; }
        .cta-body { font-size: 10pt; color: #374151; margin-bottom: 8px; }
        .cta-price { font-size: 13pt; font-weight: 700; color: #C2410C; margin-bottom: 4px; }
        .sig { font-size: 10pt; color: #374151; margin-top: 16px; }
        .sig-name { font-weight: 700; }
        .sig-title { font-size: 8pt; color: #6b7280; }
        .fine-print { font-size: 8pt; color: #6b7280; font-style: italic; margin-top: 16px; }
        .footer { font-size: 7.5pt; color: #6b7280; text-align: center; margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
        .print-btn { background: #C2410C; color: white; border: none; padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; margin: 1rem auto; display: block; }
        .print-btn:hover { background: #a3360a; }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <button className="print-btn" disabled={generating || !scriptLoaded} onClick={() => {
          if (!reportRef.current || !window.html2pdf) return
          setGenerating(true)
          const filename = `${(audit.business_name || 'Audit').replace(/[^a-zA-Z0-9]/g, '_')}_Reputation_Risk_Audit.pdf`
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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dark.png" alt="RespondPal" style={{ height: 26, marginBottom: '1rem', display: 'block' }} />

        <div className="label">Reputation Risk Audit</div>
        <h1 className="title">{audit.business_name}</h1>
        <div className="subtitle">{now} &nbsp;|&nbsp; Platforms: {platforms}</div>

        <div className="stats-bar">
          <div className="stat">
            <div className="stat-num">{combinedTotal}</div>
            <div className="stat-label">Reviews audited</div>
          </div>
          <div className="stat">
            <div className="stat-num orange">{combinedRate}</div>
            <div className="stat-label">Response rate</div>
          </div>
          <div className="stat">
            <div className="stat-num red">{critical.length}</div>
            <div className="stat-label">Critical findings</div>
          </div>
          <div className="stat">
            <div className="stat-num orange">{combinedNeg}</div>
            <div className="stat-label">Negative unanswered</div>
          </div>
        </div>

        {summary && <p className="body">{summary}</p>}

        {(moderate.length > 0 || minor.length > 0) && (
          <p className="body">
            <b>Beyond the critical items below, this audit also identified{' '}
            {[moderate.length > 0 && `${moderate.length} moderate`, minor.length > 0 && `${minor.length} minor`].filter(Boolean).join(' and ')}{' '}
            findings</b> that should be addressed — including defensive tone, billing arguments, and templated responses.
          </p>
        )}

        <p className="body">
          <b>Why this matters:</b> Google's AI Overviews, ChatGPT, and Perplexity now read your review responses to decide whether to recommend your business. Response quality directly shapes how AI represents you. A combative or privacy-violating response doesn't just hurt you with the one person who reads it — it trains AI to characterize your business negatively.
        </p>

        {isHipaa && critical.length > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
            padding: '0.75rem 1rem', margin: '0.5rem 0 0.75rem', fontSize: '8.5pt', color: '#7f1d1d',
          }}>
            <b>HIPAA enforcement context:</b> The privacy violations flagged in this report are the same patterns
            that have resulted in federal enforcement actions against other healthcare practices — including a
            $23,000 fine against a California dental practice (New Vision Dental, 2022), a $50,000 fine against
            a North Carolina dental practice (2022), and a $30,000 settlement with a New Jersey healthcare provider
            (Manasa Health Center, 2023) — all for disclosing protected health information in online review responses.
            Even confirming someone is a patient is a violation under the HIPAA Privacy Rule.
          </div>
        )}

        {gTotal > 0 && (
          <>
            <div className="label" style={{ marginTop: 12 }}>Google Business Profile</div>
            <div className="platform-line">
              {gTotal} visible reviews &nbsp;|&nbsp; {gText} with text &nbsp;|&nbsp;{' '}
              {gResp} responded to ({gText > 0 ? ((gResp / gText) * 100).toFixed(1) : 0}% of reviews with text) &nbsp;|&nbsp;{' '}
              {gNeg} negative unanswered
            </div>
          </>
        )}

        {hasYelp && (
          <>
            <div className="label" style={{ marginTop: 8 }}>Yelp Business Profile</div>
            <div className="platform-line">
              {yTotal} visible reviews &nbsp;|&nbsp; {yText} with text &nbsp;|&nbsp;{' '}
              {yResp} responded to ({yText > 0 ? ((yResp / yText) * 100).toFixed(1) : 0}% of reviews with text) &nbsp;|&nbsp;{' '}
              {yNeg} negative unanswered
            </div>
          </>
        )}

        {/* ── CRITICAL FINDINGS ── */}
        {critical.length > 0 && (
          <>
            <hr className="divider" style={{ marginTop: 20 }} />
            <div className="label">Critical Findings</div>
            <h2 className="reco-h2" style={{ fontSize: '14pt' }}>
              {critical.length} responses on your profile require immediate attention.
            </h2>

            {shown.map((f, i) => (
              <div key={i} className="finding-wrap">
                <div className="finding">
                  <div className="finding-bar" />
                  <div className="finding-content">
                    <div className="finding-header">
                      <span className="crit">CRITICAL</span>
                      <span className="tags">{(f.issues || []).join(', ')}</span>
                    </div>
                    {f.review_summary && (
                      <div className="finding-review">{f.review_summary}</div>
                    )}
                    {f.original_excerpt && (
                      <p className="finding-response">
                        <b>Your response:</b> &ldquo;{highlightExcerpt(f.original_excerpt, f.violating_phrase)}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                {inlineRewriteIds.has(i) && f.rewrite && (
                  <div className="rewrite-card" style={{ margin: '0' }}>
                    <div className="rewrite-bar" />
                    <div className="rewrite-content">
                      <div className="rewrite-label">How we'd fix it</div>
                      <div className="rewrite-text">{f.rewrite}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {overflow > 0 && (
              <p className="overflow">
                + {overflow} additional critical finding{overflow > 1 ? 's' : ''} identified.{' '}
                Full details and rewrites are included with our Reputation Cleanup service.
              </p>
            )}
          </>
        )}

        {combinedNeg > 0 && (
          <p className="neg-note">
            <b>{combinedNeg} negative reviews (1-3★) have no response at all</b> across your profiles — each one visible to every potential customer and to AI search tools.
          </p>
        )}

        {critical.length > 0 && (
          <p className="rewrite-note" style={{ marginTop: 10 }}>
            The highlighted text above shows the exact language creating risk. Recommended rewrites for all {critical.length} critical findings are included with our Reputation Cleanup.
          </p>
        )}

        {/* ── RECOMMENDATION + CTA ── */}
        <div className="page-break" />
        <div className="reco-section">
          <h2 className="reco-h2">What I'd Recommend</h2>
          <p className="body">
            {critical.length > 0
              ? 'The critical responses flagged above carry real risk — privacy violations and combative tone that are visible to every potential customer and to AI search tools right now. Here\'s what I\'d do:'
              : 'Your profile is in solid shape overall. Here\'s what I\'d focus on to keep it that way and sharpen it further:'}
          </p>
          {(() => {
            const steps = []
            if (critical.length > 0) {
              steps.push({
                lead: 'Rewrite the flagged responses.',
                rest: ' Each critical finding has a recommended rewrite that fixes the problem while preserving what the response was trying to accomplish. These should be updated as soon as possible.'
              })
            }
            if (combinedNeg > 0) {
              steps.push({
                lead: `Respond to the ${combinedNeg} unanswered negative${combinedNeg === 1 ? '' : 's'}.`,
                rest: ' Every one is an opportunity to show future customers and AI that your business engages professionally.'
              })
            }
            if (moderate.length > 0) {
              steps.push({
                lead: `Clean up the ${moderate.length} moderate finding${moderate.length === 1 ? '' : 's'}.`,
                rest: ' Tone and consistency issues that are worth fixing even though they\'re lower risk than the critical items.'
              })
            }
            steps.push({
              lead: 'Protect it going forward.',
              rest: ' A clean profile doesn\'t stay clean on its own — new reviews need timely, on-brand responses every time.'
            })
            return steps.map((step, i) => (
              <p className="reco-step" key={i}>{i + 1}. <b>{step.lead}</b>{step.rest}</p>
            ))
          })()}
        </div>

        <div className="cta-box">
          <div className="cta-head">Want us to handle this for you?</div>
          <div className="cta-body">
            {critical.length > 0
              ? 'We\'ll rewrite every flagged response, respond to all unanswered negatives, and clean up your entire profile.'
              : combinedNeg > 0
                ? 'We\'ll respond to every unanswered negative and keep your profile sharp going forward.'
                : 'We\'ll take every future review off your plate — responded to within 24 hours, every time.'}
          </div>
          <div className="cta-price">Reputation Cleanup — $197 one-time</div>
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <a href="https://buy.stripe.com/9B6fZj61x2lt7Dt7ZLebu04" style={{
              display: 'inline-block', background: '#111827', color: 'white',
              padding: '10px 28px', borderRadius: 6, fontWeight: 700, fontSize: '11pt',
              textDecoration: 'none'
            }}>Get your cleanup →</a>
          </div>
          <div style={{ fontSize: '7.5pt', color: '#6b7280', marginBottom: 8 }}>
            respondpal.ai/audit/cleanup-confirmed
          </div>
          <div className="cta-body" style={{ marginTop: 10 }}>
            And if you want it handled permanently — every new review, every platform, within 24 hours — our monthly service starts at $397/mo.
          </div>
        </div>

        <div className="sig">
          If you have any questions about this report or want to discuss what we found, just reply to this email or reach out directly. Happy to walk you through it.
        </div>
        <div className="sig" style={{ marginTop: 8 }}>
          <span className="sig-name">Jacob Merkley</span><br />
          <span className="sig-title">Founder, RespondPal</span><br />
          <span className="sig-title">jacob@respondpal.ai &nbsp;|&nbsp; respondpal.ai</span>
        </div>

        <p className="fine-print">
          This report was generated by RespondPal's proprietary AI, calibrated across thousands of real business review responses in dental, legal, veterinary, auto repair, the trades, restaurants, and more.
        </p>

        <div className="footer">
          Confidential &nbsp;|&nbsp; Prepared by Jacob Merkley, RespondPal &nbsp;|&nbsp; respondpal.ai
        </div>
      </div>
    </>
  )
}
