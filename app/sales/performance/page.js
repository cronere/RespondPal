'use client'

import { useState, useEffect } from 'react'

function formatMoney(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a1a1a' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  )
}

export default function MyPerformance() {
  const [leads, setLeads] = useState([])
  const [commissions, setCommissions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [calc1, setCalc1] = useState('')
  const [calc2, setCalc2] = useState('')
  const [calc3, setCalc3] = useState('')
  const [calcCleanups, setCalcCleanups] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/leads').then((r) => r.json()),
      fetch('/api/sales/commissions').then((r) => r.json()),
    ])
      .then(([leadsData, commissionsData]) => {
        if (leadsData.leads) setLeads(leadsData.leads)
        if (commissionsData.lifetime_total_cents !== undefined) setCommissions(commissionsData)
        if (leadsData.error || commissionsData.error) setError(leadsData.error || commissionsData.error)
      })
      .catch(() => setError('Something went wrong loading your performance data.'))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const totalLeads = leads.length
  const leadsThisMonth = leads.filter((l) => new Date(l.created_at) >= thisMonthStart).length
  const leadsLastMonth = leads.filter((l) => {
    const d = new Date(l.created_at)
    return d >= lastMonthStart && d < thisMonthStart
  }).length

  const wonCount = leads.filter((l) => l.stage === 'won').length
  const lostCount = leads.filter((l) => l.stage === 'lost').length
  const openCount = totalLeads - wonCount - lostCount

  const overallConversion = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0
  const resolvedCount = wonCount + lostCount
  const closeRate = resolvedCount > 0 ? Math.round((wonCount / resolvedCount) * 100) : null

  // won_at only exists on leads won since this field was added — older
  // wins have no way to know retroactively when they actually closed, so
  // this only averages over leads that actually have the timestamp,
  // rather than skewing the number with a partial or assumed value.
  const wonWithTiming = leads.filter((l) => l.stage === 'won' && l.won_at)
  const avgDaysToClose = wonWithTiming.length > 0
    ? Math.round(
        wonWithTiming.reduce((sum, l) => {
          const created = new Date(l.created_at)
          const won = new Date(l.won_at)
          return sum + (won - created) / (1000 * 60 * 60 * 24)
        }, 0) / wonWithTiming.length
      )
    : null

  const stageCounts = {
    lead: leads.filter((l) => l.stage === 'lead').length,
    contacting: leads.filter((l) => l.stage === 'contacting').length,
    response_sent: leads.filter((l) => l.stage === 'response_sent').length,
    won: wonCount,
    lost: lostCount,
  }

  // Calculator — month-1 commission is always 100% of price, so this is
  // just the raw tier prices times count. Cleanup commission is the
  // fixed 50/50 split ($98.50 per Cleanup). Existing residual is real
  // data already fetched above, not a projection.
  const n1 = parseInt(calc1) || 0
  const n2 = parseInt(calc2) || 0
  const n3 = parseInt(calc3) || 0
  const nCleanups = parseInt(calcCleanups) || 0
  const fromNewClosesCents = (n1 * 39700) + (n2 * 64900) + (n3 * 89700)
  const fromCleanupsCents = nCleanups * 9850
  const existingResidualCents = commissions?.total_monthly_residual_cents || 0
  const calcTotalCents = fromNewClosesCents + fromCleanupsCents + existingResidualCents

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>My Performance</h1>
        <p className="admin-page-sub">
          Your own numbers — where leads are actually going, and what your book is actually
          earning. Useful for spotting whether you need more leads, or need to close the ones you
          already have.
        </p>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
            Pipeline
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total leads added" value={totalLeads} />
            <StatCard
              label="Added this month"
              value={leadsThisMonth}
              sub={leadsLastMonth > 0 ? `${leadsLastMonth} last month` : undefined}
            />
            <StatCard
              label="Conversion rate"
              value={`${overallConversion}%`}
              sub="of all leads you've ever added"
            />
            <StatCard
              label="Close rate"
              value={closeRate !== null ? `${closeRate}%` : '—'}
              sub={closeRate !== null ? 'of leads you\'ve actually resolved (won or lost)' : 'no resolved leads yet'}
            />
            <StatCard
              label="Avg. time to close"
              value={avgDaysToClose !== null ? `${avgDaysToClose}d` : '—'}
              sub={avgDaysToClose !== null ? `from ${wonWithTiming.length} win${wonWithTiming.length === 1 ? '' : 's'} with timing data` : 'no wins with timing data yet'}
            />
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>Where your leads stand right now</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'New', count: stageCounts.lead, color: '#6b7280' },
                { label: 'Contacting', count: stageCounts.contacting, color: '#C2410C' },
                { label: 'Report sent', count: stageCounts.response_sent, color: '#D97706' },
                { label: 'Won', count: stageCounts.won, color: '#15803d' },
                { label: 'Lost', count: stageCounts.lost, color: '#B91C1C' },
              ].map((s) => (
                <div key={s.label} style={{ flex: '1 1 100px', textAlign: 'center', padding: '0.6rem 0.4rem', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {openCount > 0 && (
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.75rem', marginBottom: 0 }}>
                {openCount} lead{openCount === 1 ? '' : 's'} still open and unresolved.
              </p>
            )}
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>
            Earnings
          </h2>
          {commissions ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <StatCard label="Lifetime earned" value={formatMoney(commissions.lifetime_total_cents)} />
              <StatCard label="Earned this year" value={formatMoney(commissions.ytd_total_cents)} />
              <StatCard
                label="Current monthly residual"
                value={formatMoney(commissions.total_monthly_residual_cents)}
                sub="from your existing book, ongoing"
              />
              <StatCard
                label="Active clients"
                value={(commissions.client_values || []).length}
              />
            </div>
          ) : (
            <p className="admin-page-sub">No commission data yet.</p>
          )}

          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginTop: '2rem', marginBottom: '0.75rem' }}>
            What could I earn?
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            Enter what you&apos;re working toward closing, and see what it&apos;d actually add to
            your payout — combined with the residual you&apos;re already earning from your
            existing book, not just the new deals on their own.
          </p>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  1-location closes
                </span>
                <input
                  type="number"
                  min="0"
                  value={calc1}
                  onChange={(e) => setCalc1(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>$397/mo each</span>
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  2-location closes
                </span>
                <input
                  type="number"
                  min="0"
                  value={calc2}
                  onChange={(e) => setCalc2(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>$649/mo each</span>
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  3-location closes
                </span>
                <input
                  type="number"
                  min="0"
                  value={calc3}
                  onChange={(e) => setCalc3(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>$897/mo each</span>
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  Cleanups sold
                </span>
                <input
                  type="number"
                  min="0"
                  value={calcCleanups}
                  onChange={(e) => setCalcCleanups(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>$98.50 each</span>
              </label>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', padding: '0.4rem 0' }}>
              <span>From new closes this period (month 1, 100%)</span>
              <span style={{ fontWeight: 700 }}>{formatMoney(fromNewClosesCents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', padding: '0.4rem 0' }}>
              <span>From Cleanups sold</span>
              <span style={{ fontWeight: 700 }}>{formatMoney(fromCleanupsCents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', padding: '0.4rem 0', borderBottom: '1px solid #f3f4f6' }}>
              <span>From your existing book (real, ongoing residual)</span>
              <span style={{ fontWeight: 700 }}>{formatMoney(existingResidualCents)}</span>
            </div>
          </div>

          <div style={{ background: '#111827', color: 'white', borderRadius: 10, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Total expected payout</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{formatMoney(calcTotalCents)}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            New closes shown at month-1 pricing — actual payout depends on when in the pay period
            each client&apos;s payment actually clears. 4+ location deals aren&apos;t included here
            since those are priced individually — check the Toolkit&apos;s Commission tab for that
            range.
          </p>
        </>
      )}
    </div>
  )
}
