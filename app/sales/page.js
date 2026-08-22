'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SalesDashboard() {
  const [leads, setLeads] = useState([])
  const [rep, setRep] = useState(null)

  useEffect(() => {
    fetch('/api/sales/me').then((r) => r.json()).then((d) => setRep(d.rep)).catch(() => {})
    fetch('/api/sales/leads').then((r) => r.json()).then((d) => setLeads(d.leads || [])).catch(() => {})
  }, [])

  const counts = {
    lead: leads.filter((l) => l.stage === 'lead').length,
    contacting: leads.filter((l) => l.stage === 'contacting').length,
    response_sent: leads.filter((l) => l.stage === 'response_sent').length,
    won: leads.filter((l) => l.stage === 'won').length,
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Welcome{rep ? `, ${rep.name}` : ''}.</h1>
        <p className="admin-page-sub">Here&apos;s your pipeline at a glance.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{counts.lead}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>New leads</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{counts.contacting}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Contacting</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{counts.response_sent}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Report sent, awaiting response</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{counts.won}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Won</div>
        </div>
      </div>

      <div className="drawer-section">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a1a' }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/sales/leads" className="rev-ai-btn">+ Add a Lead</Link>
          <Link href="/sales/audit-request" className="rev-mini-btn">Request an Audit</Link>
          <Link href="/sales/response-examples" className="rev-mini-btn">Create Response Examples PDF</Link>
          <Link href="/sales/onboarding" className="rev-mini-btn">Onboard a Client</Link>
        </div>
      </div>
    </div>
  )
}
