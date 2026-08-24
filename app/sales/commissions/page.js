'use client'

import { useState, useEffect } from 'react'

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyCommissions() {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/sales/commissions')
      .then((r) => r.json())
      .then((d) => {
        if (d.periods) setPeriods(d.periods)
        else setError(d.error || 'Failed to load.')
      })
      .catch(() => setError('Something went wrong.'))
      .finally(() => setLoading(false))
  }, [])

  const totalPending = periods.filter((p) => p.status !== 'approved').reduce((sum, p) => sum + p.total_cents, 0)
  const totalApproved = periods.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.total_cents, 0)

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>My Commissions</h1>
        <p className="admin-page-sub">
          What&apos;s accruing toward you, in real time. A period marked <b>pending</b> is still being
          calculated and hasn&apos;t been finalized yet — Jacob reviews and approves each payout
          period before it&apos;s official. <b>Approved</b> means it&apos;s confirmed and on schedule
          to be paid on the date shown.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 180 }}>
          <div style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Pending</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(totalPending)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 180 }}>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Approved</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a' }}>{formatMoney(totalApproved)}</div>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : periods.length === 0 ? (
        <p className="admin-page-sub">Nothing accruing yet — this fills in as your clients&apos; payments come through.</p>
      ) : (
        <div className="demo-list">
          {periods.map((p) => (
            <div key={p.period_start} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpanded(expanded === p.period_start ? null : p.period_start)}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {p.period_start} to {p.period_end}
                    <span style={{
                      marginLeft: '0.6rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                      color: p.status === 'approved' ? '#15803d' : '#92400E',
                      background: p.status === 'approved' ? '#F0FDF4' : '#FFFBEB',
                      padding: '0.15rem 0.5rem', borderRadius: 999,
                    }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                    {p.status === 'approved' ? `Paid out ${p.payout_date}` : `Scheduled payout: ${p.payout_date}`}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a1a1a' }}>{formatMoney(p.total_cents)}</div>
              </div>

              {expanded === p.period_start && (
                <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '0.8rem', paddingTop: '0.8rem' }}>
                  {p.events.map((e) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>
                      <span>
                        {e.clients?.business_name || 'Unknown client'}
                        <span style={{ color: '#9ca3af' }}> · month {e.commission_month}, {(e.commission_rate * 100).toFixed(0)}% · {formatDate(e.created_at)}</span>
                      </span>
                      <span style={{ fontWeight: 700 }}>{formatMoney(e.commission_amount_cents)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
