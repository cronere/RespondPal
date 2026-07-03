'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function AuditReport() {
  const { id } = useParams()
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  const critical = findings.filter(f => (f.severity || '').toLowerCase() === 'critical')
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
  const combinedRate = combinedTotal > 0 ? ((combinedResp / combinedTotal) * 100).toFixed(1) + '%' : 'N/A'

  const shown = critical.slice(0, 5)
  const overflow = critical.length - shown.length

  const summary = (audit.summary || '').split('--- Batch')[0].trim()
  const firstRewrite = critical.find(f => f.rewrite)

  const hasYelp = yTotal > 0
  const platforms = hasYelp ? 'Google & Yelp' : 'Google'
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .report { padding: 0; }
          .page-break { page-break-before: always; }
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
        .logo { height: 22px; margin-bottom: 1rem; }
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
        .finding { display: flex; margin-bottom: 8px; border: 1px solid #e5e7eb; }
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
        <button className="print-btn" onClick={() => window.print()}>
          Save as PDF (Ctrl+P / Cmd+P)
        </button>
      </div>

      <div className="report">
        <div className="top-bar" />

        <img src="/logo-dark.png" alt="RespondPal" className="logo" />

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

        {gTotal > 0 && (
          <>
            <div className="label" style={{ marginTop: 12 }}>Google Business Profile</div>
            <div className="platform-line">
              {gTotal} visible reviews &nbsp;|&nbsp; {gText} with text &nbsp;|&nbsp;{' '}
              {gResp} responded to ({gTotal > 0 ? ((gResp / gTotal) * 100).toFixed(1) : 0}%) &nbsp;|&nbsp;{' '}
              {gNeg} negative unanswered
            </div>
          </>
        )}

        {hasYelp && (
          <>
            <div className="label" style={{ marginTop: 8 }}>Yelp Business Profile</div>
            <div className="platform-line">
              {yTotal} visible reviews &nbsp;|&nbsp; {yText} with text &nbsp;|&nbsp;{' '}
              {yResp} responded to ({yTotal > 0 ? ((yResp / yTotal) * 100).toFixed(1) : 0}%) &nbsp;|&nbsp;{' '}
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
              <div key={i} className="finding">
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
                      <b>Your response:</b> &ldquo;{f.original_excerpt}&rdquo;
                    </p>
                  )}
                </div>
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

        {/* ── EXAMPLE REWRITE ── */}
        {firstRewrite && (
          <div className="example-section">
            <div className="label">Example: How we'd fix it</div>
            <div className="platform-line">Here's what the first finding above would look like with a professional, on-brand rewrite:</div>
            <div className="rewrite-card">
              <div className="rewrite-bar" />
              <div className="rewrite-content">
                <div className="rewrite-label">Rewritten Response</div>
                <div className="rewrite-text">{firstRewrite.rewrite}</div>
              </div>
            </div>
            <p className="rewrite-note">
              Recommended rewrites for all {critical.length} critical findings are included with our Reputation Cleanup.
            </p>
          </div>
        )}

        {/* ── RECOMMENDATION + CTA ── */}
        <div className="page-break" />
        <div className="reco-section">
          <h2 className="reco-h2">What I'd Recommend</h2>
          <p className="body">
            The critical responses flagged above carry real risk — privacy violations and combative tone that are visible to every potential customer and to AI search tools right now. Here's what I'd do:
          </p>
          <p className="reco-step">1. <b>Rewrite the flagged responses.</b> Each critical finding has a recommended rewrite that fixes the problem while preserving what the response was trying to accomplish. These should be updated as soon as possible.</p>
          <p className="reco-step">2. <b>Respond to the {combinedNeg} unanswered negatives.</b> Every one is an opportunity to show future customers and AI that your business engages professionally.</p>
          <p className="reco-step">3. <b>Protect it going forward.</b> A clean profile doesn't stay clean on its own. New reviews need timely, on-brand responses.</p>
        </div>

        <div className="cta-box">
          <div className="cta-head">Want us to handle this for you?</div>
          <div className="cta-body">
            We'll rewrite every flagged response, respond to all unanswered negatives, and clean up your entire profile.
          </div>
          <div className="cta-price">Reputation Cleanup — $197 one-time</div>
          <div style={{ marginTop: 10, marginBottom: 8 }}>
            <a href="https://buy.stripe.com/9B6fZj61x2lt7Dt7ZLebu04" style={{
              display: 'inline-block', background: '#111827', color: 'white',
              padding: '10px 28px', borderRadius: 6, fontWeight: 700, fontSize: '11pt',
              textDecoration: 'none'
            }}>Get your cleanup →</a>
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
