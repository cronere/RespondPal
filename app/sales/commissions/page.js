'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyCommissions() {
  const [periods, setPeriods] = useState([])
  const [lifetimeTotal, setLifetimeTotal] = useState(0)
  const [ytdTotal, setYtdTotal] = useState(0)
  const [totalResidual, setTotalResidual] = useState(0)
  const [totalNextMonthResidual, setTotalNextMonthResidual] = useState(0)
  const [clientValues, setClientValues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [disputing, setDisputing] = useState(null)
  const [disputeNote, setDisputeNote] = useState('')

  const load = () => {
    fetch('/api/sales/commissions')
      .then((r) => r.json())
      .then((d) => {
        if (d.periods) {
          setPeriods(d.periods)
          setLifetimeTotal(d.lifetime_total_cents || 0)
          setYtdTotal(d.ytd_total_cents || 0)
          setTotalResidual(d.total_monthly_residual_cents || 0)
          setTotalNextMonthResidual(d.total_next_month_residual_cents || 0)
          setClientValues(d.client_values || [])
        } else {
          setError(d.error || 'Failed to load.')
        }
      })
      .catch(() => setError('Something went wrong.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Three real states, not two — a period that's been paid is neither
  // "pending" nor "approved" anymore, and lumping it into either bucket
  // would misrepresent it.
  const totalPending = periods.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.total_cents, 0)
  const totalApproved = periods.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.total_cents, 0)
  const totalPaid = periods.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.total_cents, 0)

  const openDispute = (eventId) => {
    setDisputing(eventId)
    setDisputeNote('')
  }

  const submitDispute = async (eventId) => {
    if (!disputeNote.trim()) {
      setError('Please explain what looks wrong.')
      return
    }
    try {
      const res = await fetch(`/api/sales/commissions/${eventId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: disputeNote }),
      })
      if (res.ok) {
        setDisputing(null)
        load()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to submit dispute.')
      }
    } catch {
      setError('Something went wrong.')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>My Commissions</h1>
        <p className="admin-page-sub">
          What&apos;s accruing toward you, in real time. <b>Pending</b> means it&apos;s still being
          calculated and hasn&apos;t been finalized yet. <b>Approved</b> means Jacob has confirmed
          it&apos;s correct and it&apos;s scheduled to be paid. <b>Paid</b> means the transfer has
          actually gone out. If something looks wrong on a specific line, use Dispute right on that
          item — per your agreement, disputes need to be raised within 30 days.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 150 }}>
          <div style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Pending</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(totalPending)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 150 }}>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Approved</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(totalApproved)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 150 }}>
          <div style={{ fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 700, textTransform: 'uppercase' }}>Paid</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(totalPaid)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 150 }}>
          <div style={{ fontSize: '0.78rem', color: '#1a1a1a', fontWeight: 700, textTransform: 'uppercase' }}>This Year</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(ytdTotal)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 150 }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Lifetime Earned</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(lifetimeTotal)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 150 }}>
          <div style={{ fontSize: '0.78rem', color: '#C2410C', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Residual</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(totalResidual)}</div>
          {totalNextMonthResidual !== totalResidual && (
            <div style={{ fontSize: '0.72rem', color: '#92400E', marginTop: '0.15rem' }}>
              → {formatMoney(totalNextMonthResidual)} next month
            </div>
          )}
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : periods.length === 0 ? (
        <p className="admin-page-sub">Nothing accruing yet — this fills in as your clients&apos; payments come through.</p>
      ) : (
        <>
          <div className="demo-list">
            {periods.map((p) => (
              <div key={p.period_start} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpanded(expanded === p.period_start ? null : p.period_start)}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a1a1a' }}>
                      {p.period_start} to {p.period_end}
                      <span style={{
                        marginLeft: '0.6rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                        color: p.status === 'paid' ? '#1e3a8a' : p.status === 'approved' ? '#15803d' : '#92400E',
                        background: p.status === 'paid' ? '#EFF6FF' : p.status === 'approved' ? '#F0FDF4' : '#FFFBEB',
                        padding: '0.15rem 0.5rem', borderRadius: 999,
                      }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                      {p.status === 'paid'
                        ? `Paid ${p.paid_at ? formatDate(p.paid_at) : p.payout_date}`
                        : p.status === 'approved'
                          ? `Approved — scheduled payout ${p.payout_date}`
                          : `Scheduled payout: ${p.payout_date}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a1a1a' }}>{formatMoney(p.total_cents)}</div>
                    {p.status === 'paid' && p.statement_id && (
                      <Link
                        href={`/sales/statements/${p.statement_id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: '0.75rem', color: '#C2410C' }}
                      >
                        View Statement →
                      </Link>
                    )}
                  </div>
                </div>

                {expanded === p.period_start && (
                  <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '0.8rem', paddingTop: '0.8rem' }}>
                    {p.events.map((e) => (
                      <div key={e.id} style={{ marginBottom: '0.6rem', paddingBottom: '0.6rem', borderBottom: '1px solid #f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151' }}>
                          <span>
                            {e.clients?.business_name || (e.event_type === 'adjustment' ? 'Manual adjustment' : 'Unknown client')}
                            <span style={{ color: '#9ca3af' }}>
                              {e.commission_month != null && ` · month ${e.commission_month}, ${(e.commission_rate * 100).toFixed(0)}%`}
                              {' · '}{formatDate(e.created_at)}
                            </span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: 700 }}>{formatMoney(e.commission_amount_cents)}</span>
                            {!e.disputed && disputing !== e.id && (
                              <button className="rev-mini-btn" onClick={() => openDispute(e.id)} style={{ fontSize: '0.75rem' }}>Dispute</button>
                            )}
                          </span>
                        </div>
                        {e.disputed && (
                          <div style={{ fontSize: '0.78rem', color: '#b23b30', marginTop: '0.3rem' }}>
                            🚩 Disputed — pending Jacob&apos;s review: {e.dispute_note}
                          </div>
                        )}
                        {e.adjusted && e.adjustment_note && (
                          <div style={{ fontSize: '0.78rem', color: '#92400E', marginTop: '0.3rem' }}>
                            ℹ️ This amount was adjusted: {e.adjustment_note}
                          </div>
                        )}
                        {disputing === e.id && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <input
                              value={disputeNote}
                              onChange={(ev) => setDisputeNote(ev.target.value)}
                              placeholder="What looks wrong about this?"
                              style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                            />
                            <button className="rev-ai-btn" onClick={() => submitDispute(e.id)} style={{ fontSize: '0.78rem' }}>Submit</button>
                            <button className="rev-mini-btn" onClick={() => setDisputing(null)} style={{ fontSize: '0.78rem' }}>Cancel</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {clientValues.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginTop: '2rem', marginBottom: '0.4rem' }}>
                Your Clients
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.9rem' }}>
                What each client you&apos;ve brought in has generated so far, what they&apos;re
                currently worth to you per month going forward, and roughly how they&apos;re doing.
                Residual naturally decreases as a client ages into later commission tiers —
                that&apos;s the structure working as intended, not a mistake.
              </p>
              <div className="demo-list">
                {clientValues.map((c) => (
                  <div key={c.client_id} className="response-demo-card" style={{ cursor: 'default' }}>
                    <div>
                      <div className="demo-card-name">{c.business_name}</div>
                      <div className="demo-card-meta">
                        <span style={{
                          color: c.health?.tone === 'green' ? '#15803d' : c.health?.tone === 'yellow' ? '#92400E' : '#b23b30',
                          fontWeight: 600,
                        }}>
                          {c.health?.label || c.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Lifetime: {formatMoney(c.lifetime_cents)}</div>
                      <div style={{ fontWeight: 700, color: c.monthly_residual_cents > 0 ? '#15803d' : '#9ca3af' }}>
                        {formatMoney(c.monthly_residual_cents)}/mo
                      </div>
                      {c.next_month_residual_cents !== c.monthly_residual_cents && (
                        <div style={{ fontSize: '0.72rem', color: '#92400E' }}>
                          → {formatMoney(c.next_month_residual_cents)} next month
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
