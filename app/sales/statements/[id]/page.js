'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function StatementDetail() {
  const { id } = useParams()
  const [statement, setStatement] = useState(null)
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
    fetch(`/api/sales/statements/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.statement) setStatement(d.statement)
        else setError(d.error || 'Failed to load.')
      })
      .catch(() => setError('Something went wrong.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'Helvetica, Arial, sans-serif' }}>Loading statement...</div>
  if (error) return <div style={{ padding: '2rem', fontFamily: 'Helvetica, Arial, sans-serif', color: '#b91c1c' }}>{error}</div>
  if (!statement) return null

  const lineItems = statement.line_items || []

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .statement { padding: 0; }
          @page { margin: 0.5in 0.6in; }
        }
        .statement {
          font-family: Helvetica, Arial, sans-serif;
          max-width: 700px;
          margin: 0 auto;
          padding: 1.5rem;
          color: #374151;
          font-size: 10pt;
          line-height: 1.5;
        }
        .top-bar { height: 6px; background: #C2410C; margin: -1.5rem -1.5rem 1.5rem -1.5rem; }
        .label { font-size: 8pt; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .title { font-size: 20pt; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
        .subtitle { font-size: 10pt; color: #6b7280; margin-bottom: 1.25rem; }
        .meta-row { display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 0.9rem 0; margin-bottom: 1.25rem; }
        .meta-label { font-size: 7.5pt; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
        .meta-value { font-size: 10pt; font-weight: 700; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; }
        th { text-align: left; font-size: 8pt; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding: 6px 8px; }
        th.num, td.num { text-align: right; }
        td { font-size: 9pt; color: #374151; border-bottom: 1px solid #f3f4f6; padding: 8px; }
        .total-row td { font-weight: 700; color: #111827; border-top: 2px solid #e5e7eb; border-bottom: none; font-size: 10.5pt; }
        .fine-print { font-size: 8pt; color: #6b7280; font-style: italic; margin-top: 1rem; }
        .footer { font-size: 7.5pt; color: #6b7280; text-align: center; margin-top: 1.5rem; padding-top: 8px; border-top: 1px solid #e5e7eb; }
        .print-btn { background: #C2410C; color: white; border: none; padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; margin: 1rem auto; display: block; }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <button className="print-btn" disabled={generating || !scriptLoaded} onClick={() => {
          if (!reportRef.current || !window.html2pdf) return
          setGenerating(true)
          const filename = `RespondPal_Statement_${statement.period_start}.pdf`
          const opt = {
            margin: [0.4, 0.5, 0.4, 0.5],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          }
          window.html2pdf().set(opt).from(reportRef.current).save().then(() => setGenerating(false)).catch(() => setGenerating(false))
        }}>
          {generating ? 'Generating PDF...' : scriptLoaded ? 'Download PDF' : 'Loading...'}
        </button>
      </div>

      <div className="statement" ref={reportRef}>
        <div className="top-bar" />
        <div className="label">Commission Statement</div>
        <h1 className="title">{statement.rep_name}</h1>
        <div className="subtitle">{statement.rep_email}</div>

        <div className="meta-row">
          <div>
            <div className="meta-label">Period</div>
            <div className="meta-value">{statement.period_start} to {statement.period_end}</div>
          </div>
          <div>
            <div className="meta-label">Paid</div>
            <div className="meta-value">{statement.payout_date}</div>
          </div>
          <div>
            <div className="meta-label">Total</div>
            <div className="meta-value" style={{ color: '#C2410C' }}>{formatMoney(statement.total_cents)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Client / Description</th>
              <th>Month</th>
              <th>Rate</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li, i) => (
              <tr key={i}>
                <td>{li.description}{li.date && <span style={{ color: '#9ca3af' }}> · {formatDate(li.date)}</span>}</td>
                <td>{li.commission_month != null ? li.commission_month : '—'}</td>
                <td>{li.commission_rate != null ? `${(li.commission_rate * 100).toFixed(0)}%` : '—'}</td>
                <td className="num">{formatMoney(li.commission_amount_cents)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={3}>Total</td>
              <td className="num">{formatMoney(statement.total_cents)}</td>
            </tr>
          </tbody>
        </table>

        <p className="fine-print">
          This statement reflects your commission as of the date it was issued. If you believe any
          amount is incorrect, per your agreement you have 30 days from receiving this statement to
          notify RespondPal in writing — you can also flag a specific line directly from My
          Commissions in Sales HQ.
        </p>

        <div className="footer">RespondPal LLC &nbsp;|&nbsp; Confidential</div>
      </div>
    </>
  )
}
