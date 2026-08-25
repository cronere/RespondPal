'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function daysSince(iso) {
  if (!iso) return null
  const then = new Date(iso)
  const now = new Date()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export default function SalesDashboard() {
  const [leads, setLeads] = useState([])
  const [rep, setRep] = useState(null)
  const [tasks, setTasks] = useState([])
  const [audits, setAudits] = useState([])

  useEffect(() => {
    fetch('/api/sales/me').then((r) => r.json()).then((d) => setRep(d.rep)).catch(() => {})
    fetch('/api/sales/leads').then((r) => r.json()).then((d) => setLeads(d.leads || [])).catch(() => {})
    fetch('/api/sales/tasks').then((r) => r.json()).then((d) => setTasks(d.tasks || [])).catch(() => {})
    fetch('/api/sales/audit-deliveries').then((r) => r.json()).then((d) => setAudits(d.audits || [])).catch(() => {})
  }, [])

  const counts = {
    lead: leads.filter((l) => l.stage === 'lead').length,
    contacting: leads.filter((l) => l.stage === 'contacting').length,
    response_sent: leads.filter((l) => l.stage === 'response_sent').length,
    won: leads.filter((l) => l.stage === 'won').length,
  }

  const overdueTasks = tasks.filter((t) => !t.completed && isOverdue(t.due_date))
  const auditsReady = audits.filter((a) => !a.rep_delivered_at)
  // A lead not touched in 75+ days is closing in on the 90-day ownership
  // cutoff — surfaced here as a proactive nudge, before it actually opens
  // up for another rep to claim, not after.
  const leadsAtRisk = leads.filter((l) => {
    if (l.stage === 'won' || l.stage === 'lost') return false
    const days = daysSince(l.last_contacted_at || l.created_at)
    return days !== null && days >= 75 && days < 90
  })

  const totalAttentionItems = overdueTasks.length + auditsReady.length + leadsAtRisk.length

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

      <div className="drawer-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a1a' }}>
          Needs your attention {totalAttentionItems > 0 && (
            <span style={{
              background: '#DC2626', color: 'white', fontSize: '0.78rem', fontWeight: 700,
              borderRadius: 999, padding: '0.1rem 0.55rem', marginLeft: '0.4rem', verticalAlign: 'middle',
            }}>
              {totalAttentionItems}
            </span>
          )}
        </h2>

        {totalAttentionItems === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Nothing needs attention right now — you&apos;re caught up.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {overdueTasks.map((t) => (
              <Link key={`task-${t.id}`} href={`/sales/leads/${t.lead_id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                padding: '0.6rem 0.9rem', textDecoration: 'none', color: '#1a1a1a', fontSize: '0.85rem',
              }}>
                <span>🔴 Overdue task: {t.title} — {t.leads?.business_name || 'a lead'}</span>
                <span style={{ color: '#b23b30', fontWeight: 700 }}>→</span>
              </Link>
            ))}
            {auditsReady.map((a) => (
              <Link key={`audit-${a.id}`} href="/sales/audit-request" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 8,
                padding: '0.6rem 0.9rem', textDecoration: 'none', color: '#1a1a1a', fontSize: '0.85rem',
              }}>
                <span>📋 Audit ready to deliver: {a.business_name}</span>
                <span style={{ color: '#C2410C', fontWeight: 700 }}>→</span>
              </Link>
            ))}
            {leadsAtRisk.map((l) => (
              <Link key={`risk-${l.id}`} href={`/sales/leads/${l.id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
                padding: '0.6rem 0.9rem', textDecoration: 'none', color: '#1a1a1a', fontSize: '0.85rem',
              }}>
                <span>⏳ {l.business_name} — no contact logged in {daysSince(l.last_contacted_at || l.created_at)} days, opens up soon</span>
                <span style={{ color: '#92400E', fontWeight: 700 }}>→</span>
              </Link>
            ))}
          </div>
        )}
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
