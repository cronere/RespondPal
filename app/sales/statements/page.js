'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function Statements() {
  const [statements, setStatements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/sales/statements')
      .then((r) => r.json())
      .then((d) => {
        if (d.statements) setStatements(d.statements)
        else setError(d.error || 'Failed to load.')
      })
      .catch(() => setError('Something went wrong.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Statements</h1>
        <p className="admin-page-sub">
          A permanent record for each payout you&apos;ve actually been paid — issued the moment
          payment goes out, and never changed afterward. Worth keeping for your own tax records.
        </p>
      </header>

      <div style={{
        background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 8,
        padding: '1rem 1.25rem', marginBottom: '1.5rem', maxWidth: 620,
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
          How periods and pay dates work
        </div>
        <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          Client payments that clear between the <b>1st and the 15th</b> of a month are paid out on
          the <b>20th of that same month</b>. Payments that clear between the <b>16th and the last
          day</b> of a month are paid out on the <b>5th of the following month</b>.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.6, marginBottom: 0 }}>
          A given commission lands in whichever window matches when that specific client&apos;s
          payment actually cleared — not a fixed calendar month, since renewal dates vary client to
          client. That&apos;s why the period on a statement won&apos;t always line up with the
          calendar month you&apos;d expect.
        </p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : statements.length === 0 ? (
        <p className="admin-page-sub">No statements yet — one is issued automatically each time you&apos;re paid.</p>
      ) : (
        <div className="demo-list">
          {statements.map((s) => (
            <Link href={`/sales/statements/${s.id}`} key={s.id} className="response-demo-card" style={{ textDecoration: 'none' }}>
              <div>
                <div className="demo-card-name">{s.period_start} to {s.period_end}</div>
                <div className="demo-card-meta">Paid {s.payout_date}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{formatMoney(s.total_cents)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
