'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function daysSince(iso) {
  if (!iso) return null
  const then = new Date(iso)
  const now = new Date()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

const LEAD_TABS = [
  { key: 'mine', label: 'My Leads' },
  { key: 'open', label: 'Open Leads' },
  { key: 'clients', label: 'Existing Clients' },
  { key: 'tasks', label: 'Tasks' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

const STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'contacting', label: 'Contacting' },
  { key: 'response_sent', label: 'Response Examples / Audit Sent' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

export default function SalesLeads() {
  const [tab, setTab] = useState('mine')
  const [leads, setLeads] = useState([])
  const [openLeads, setOpenLeads] = useState([])
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingOpen, setLoadingOpen] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [saving, setSaving] = useState(false)
  const [claiming, setClaiming] = useState(null)
  const [error, setError] = useState('')
  const [newLead, setNewLead] = useState({
    business_name: '', contact_name: '', contact_email: '', contact_phone: '',
    industry: '', state: '', google_url: '', yelp_url: '', notes: '',
  })
  const [newTask, setNewTask] = useState({ lead_id: '', title: '', due_date: '' })
  const [addingTask, setAddingTask] = useState(false)
  const [tasksDue, setTasksDue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false)

  const loadCounts = async () => {
    try {
      const res = await fetch('/api/sales/counts', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setTasksDue(data.tasksDue || 0)
    } catch {
      // badge just won't show this cycle — not worth surfacing an error for
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/leads')
      const data = await res.json()
      if (res.ok) setLeads(data.leads || [])
    } catch {
      setError('Failed to load leads.')
    }
    setLoading(false)
  }

  const loadOpen = async () => {
    setLoadingOpen(true)
    try {
      const res = await fetch('/api/sales/leads/open')
      const data = await res.json()
      if (res.ok) setOpenLeads(data.leads || [])
    } catch {
      setError('Failed to load open leads.')
    }
    setLoadingOpen(false)
  }

  const loadTasks = async () => {
    setLoadingTasks(true)
    try {
      const res = await fetch('/api/sales/tasks')
      const data = await res.json()
      if (res.ok) setTasks(data.tasks || [])
    } catch {
      setError('Failed to load tasks.')
    }
    setLoadingTasks(false)
  }

  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const res = await fetch('/api/sales/clients')
      const data = await res.json()
      if (res.ok) setClients(data.clients || [])
    } catch {
      setError('Failed to load clients.')
    }
    setLoadingClients(false)
  }

  useEffect(() => { load(); loadCounts() }, [])
  useEffect(() => {
    if (tab === 'open' && openLeads.length === 0) loadOpen()
    if (tab === 'clients' && clients.length === 0) loadClients()
    if (tab === 'tasks' && tasks.length === 0) loadTasks()
  }, [tab])

  const filteredLeads = (() => {
    const q = searchQuery.trim().toLowerCase()
    let result = leads
    if (stateFilter) result = result.filter((l) => l.state === stateFilter)
    if (!q) return result
    return result.filter((l) =>
      (l.business_name || '').toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.industry || '').toLowerCase().includes(q) ||
      (l.contact_phone || '').toLowerCase().includes(q) ||
      (l.contact_email || '').toLowerCase().includes(q)
    )
  })()

  const filteredOpenLeads = (() => {
    const q = searchQuery.trim().toLowerCase()
    let result = openLeads
    if (stateFilter) result = result.filter((l) => l.state === stateFilter)
    if (!q) return result
    return result.filter((l) =>
      (l.business_name || '').toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.industry || '').toLowerCase().includes(q) ||
      (l.contact_phone || '').toLowerCase().includes(q)
    )
  })()

  const filteredClients = (() => {
    const q = searchQuery.trim().toLowerCase()
    let result = clients
    if (stateFilter) result = result.filter((c) => c.state === stateFilter)
    if (!q) return result
    return result.filter((c) =>
      (c.business_name || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q) ||
      (c.owner_name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.rep_name || '').toLowerCase().includes(q)
    )
  })()

  const addTask = async () => {
    if (!newTask.lead_id || !newTask.title.trim() || addingTask) return
    setAddingTask(true)
    setError('')
    try {
      const res = await fetch('/api/sales/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      const data = await res.json()
      if (res.ok) {
        setTasks((prev) => [data.task, ...prev])
        setNewTask({ lead_id: '', title: '', due_date: '' })
        setShowAddTask(false)
      } else {
        setError(data.error || 'Failed to add task.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setAddingTask(false)
  }

  const toggleTask = async (task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)))
    try {
      await fetch(`/api/sales/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      loadCounts()
    } catch {
      loadTasks()
    }
  }

  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      await fetch(`/api/sales/tasks/${taskId}`, { method: 'DELETE' })
      loadCounts()
    } catch {
      loadTasks()
    }
  }

  const claimLead = async (leadId) => {
    setClaiming(leadId)
    try {
      // Claiming works exactly like any other real action on an unclaimed
      // lead — moving it to "Contacting" is both the claim and the first
      // real pipeline step, not a separate mechanism.
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'contacting' }),
      })
      if (res.ok) {
        setOpenLeads((prev) => prev.filter((l) => l.id !== leadId))
        load()
        setTab('mine')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to claim lead — someone may have just claimed it.')
        loadOpen()
      }
    } catch {
      setError('Something went wrong.')
    }
    setClaiming(null)
  }

  const createLead = async (confirmDuplicate = false) => {
    if (!newLead.business_name.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLead, confirmDuplicate }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowAdd(false)
        setNewLead({ business_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', state: '', google_url: '', yelp_url: '', notes: '' })
        load()
      } else if (res.status === 409 && data.needsConfirmation) {
        setSaving(false)
        const proceed = confirm(
          `"${data.match.businessName}" looks like it may already be ${data.match.ownedBy}'s lead. Add it anyway?`
        )
        if (proceed) {
          createLead(true)
          return
        }
      } else {
        setError(data.error || 'Failed to create lead.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  const changeStage = async (leadId, stage) => {
    // Optimistic update — the pipeline should feel instant on a live call.
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)))
    try {
      await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
    } catch {
      load() // fall back to a real refresh if the update failed silently
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Leads</h1>
        <p className="admin-page-sub">
          Your pipeline, what&apos;s up for grabs, and who&apos;s already a client — so nobody works the same business twice.
        </p>
        {tab === 'mine' && (
          <button className="rev-ai-btn" onClick={() => setShowAdd(true)} style={{ marginTop: '1rem' }}>+ Add Lead</button>
        )}
      </header>

      <div className="leads-tabs-desktop" style={{ gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {LEAD_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              color: tab === t.key ? '#C2410C' : '#6b7280',
              borderBottom: tab === t.key ? '2px solid #C2410C' : '2px solid transparent',
              marginBottom: '-1px',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            {t.label}
            {t.key === 'tasks' && tasksDue > 0 && (
              <span style={{
                background: '#DC2626', color: 'white', fontSize: '0.72rem', fontWeight: 700,
                borderRadius: 999, padding: '0.1rem 0.45rem', minWidth: 18, textAlign: 'center',
              }}>
                {tasksDue}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile-only: a tap-to-expand dropdown replaces the horizontal
          tab bar entirely on narrow screens, rather than relying on
          horizontal scroll — same reasoning as the main nav's hamburger,
          a dropdown makes it obvious there are more options instead of
          requiring the person to discover they can swipe sideways. */}
      <div className="leads-tabs-mobile" style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => setMobileTabsOpen((open) => !open)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white',
            fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ☰ {LEAD_TABS.find((t) => t.key === tab)?.label}
            {tasksDue > 0 && (
              <span style={{
                background: '#DC2626', color: 'white', fontSize: '0.72rem', fontWeight: 700,
                borderRadius: 999, padding: '0.1rem 0.45rem', minWidth: 18, textAlign: 'center',
              }}>
                {tasksDue}
              </span>
            )}
          </span>
          <span>{mobileTabsOpen ? '▲' : '▼'}</span>
        </button>
        {mobileTabsOpen && (
          <div style={{ marginTop: '0.4rem', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
            {LEAD_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setMobileTabsOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none',
                  borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '0.9rem',
                  fontWeight: tab === t.key ? 700 : 500,
                  color: tab === t.key ? '#C2410C' : '#1a1a1a',
                  background: tab === t.key ? '#FFF7ED' : 'white',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                {t.label}
                {t.key === 'tasks' && tasksDue > 0 && (
                  <span style={{
                    background: '#DC2626', color: 'white', fontSize: '0.72rem', fontWeight: 700,
                    borderRadius: 999, padding: '0.1rem 0.45rem', minWidth: 18, textAlign: 'center',
                  }}>
                    {tasksDue}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {['mine', 'open', 'clients'].includes(tab) && (leads.length > 0 || openLeads.length > 0 || clients.length > 0) && (
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              tab === 'mine' ? 'Search by business, contact, industry, phone, or email…'
                : tab === 'open' ? 'Search by business, contact, industry, or phone…'
                : 'Search by business, contact, industry, phone, or rep…'
            }
            style={{
              flex: 1, minWidth: 220, maxWidth: 420, padding: '0.6rem 0.9rem', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: '0.88rem',
            }}
          />
          {['mine', 'open', 'clients'].includes(tab) && (
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ padding: '0.6rem 0.7rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
            >
              <option value="">All states</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      )}

      {tab === 'mine' && (
        loading ? (
          <p className="admin-page-sub">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="admin-page-sub">No leads yet. Add your first one above.</p>
        ) : filteredLeads.length === 0 ? (
          <p className="admin-page-sub">No leads match &quot;{searchQuery}&quot;.</p>
        ) : (
          <div className="demo-list">
            {filteredLeads.map((l) => {
              const days = daysSince(l.last_contacted_at || l.created_at)
              const atRisk = l.stage !== 'won' && l.stage !== 'lost' && days !== null && days >= 75 && days < 90
              return (
              <div className="response-demo-card" key={l.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <Link href={`/sales/leads/${l.id}`} style={{ textDecoration: 'none' }}>
                      <div className="demo-card-name" style={{ color: '#C2410C' }}>{l.business_name}</div>
                    </Link>
                    <div className="demo-card-meta">
                      {l.industry || 'Industry not set'}
                      {l.contact_name ? ` · ${l.contact_name}` : ''}
                      {l.contact_phone ? ` · ${l.contact_phone}` : ''}
                    </div>
                    {atRisk && (
                      <div style={{
                        display: 'inline-block', marginTop: '0.35rem', background: '#FEF2F2', color: '#B91C1C',
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4,
                      }}>
                        ⏰ {90 - days}d left before this opens up to other reps
                      </div>
                    )}
                  </div>
                  <select
                    value={l.stage}
                    onChange={(e) => changeStage(l.id, e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', fontWeight: 600, maxWidth: '100%' }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {l.notes && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{l.notes}</div>}
              </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'open' && (
        <>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '1.25rem', color: '#92400E', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <b>What this is:</b> leads any rep can claim — either nobody&apos;s working them yet, or the
            previous owner hasn&apos;t logged contact in 90+ days. Ownership works the same everywhere:
            you own a lead exclusively while you&apos;ve logged real activity within the last 90 days. No
            activity for 90 days, it lands here for anyone to pick up. Taking any real action on one of
            these — claiming it, moving its stage — makes it yours. Full details in the Sales Toolkit
            under Ownership Rules.
          </div>
          {loadingOpen ? (
            <p className="admin-page-sub">Loading…</p>
          ) : openLeads.length === 0 ? (
            <p className="admin-page-sub">No open leads right now.</p>
          ) : filteredOpenLeads.length === 0 ? (
            <p className="admin-page-sub">No open leads match &quot;{searchQuery}&quot;.</p>
          ) : (
            <div className="demo-list">
              {filteredOpenLeads.map((l) => (
                <div className="response-demo-card" key={l.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="demo-card-name">{l.business_name}</div>
                      <div className="demo-card-meta">
                        {l.industry || 'Industry not set'}
                        {l.contact_name ? ` · ${l.contact_name}` : ''}
                        {l.contact_phone ? ` · ${l.contact_phone}` : ''}
                      </div>
                    </div>
                    <button
                      className="rev-mini-btn"
                      onClick={() => claimLead(l.id)}
                      disabled={claiming === l.id}
                    >
                      {claiming === l.id ? 'Claiming…' : 'Claim'}
                    </button>
                  </div>
                  {l.notes && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{l.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'clients' && (
        <>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '1.25rem', color: '#1E40AF', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <b>What this is:</b> every business already paying for RespondPal. Check here before
            pursuing a prospect — if they&apos;re already a client, don&apos;t treat them as a new lead.
            Each entry shows the owning rep so there&apos;s no confusion about which business this is or
            who gets credit for them.
          </div>
          {loadingClients ? (
            <p className="admin-page-sub">Loading…</p>
          ) : clients.length === 0 ? (
            <p className="admin-page-sub">No active clients yet.</p>
          ) : filteredClients.length === 0 ? (
            <p className="admin-page-sub">No clients match &quot;{searchQuery}&quot;.</p>
          ) : (
            <div className="demo-list">
              {filteredClients.map((c) => (
                <div className="response-demo-card" key={c.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem', cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="demo-card-name">{c.business_name}</div>
                      <div className="demo-card-meta">{c.industry || 'Industry not set'}</div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize', color: '#6b7280' }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                    {c.owner_name && <span>Contact: {c.owner_name} · </span>}
                    {c.phone && <span>{c.phone} · </span>}
                    {c.google_url && <span><a href={c.google_url} target="_blank" rel="noreferrer" style={{ color: '#C2410C' }}>Google ↗</a> · </span>}
                    {c.yelp_url && <span><a href={c.yelp_url} target="_blank" rel="noreferrer" style={{ color: '#C2410C' }}>Yelp ↗</a> · </span>}
                    <span>Owned by: {c.rep_name || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tasks' && (
        <>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            Every task across all your leads in one place. Tasks also show up individually on each
            lead&apos;s own page — this is just a faster way to see what&apos;s due without opening
            each one.
          </p>
          <button className="rev-ai-btn" onClick={() => setShowAddTask((v) => !v)} style={{ marginBottom: '1.25rem' }}>
            {showAddTask ? 'Cancel' : '+ Add Task'}
          </button>

          {showAddTask && (
            <div className="drawer-section" style={{ maxWidth: 460, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
              <label className="field">
                <span className="field-label">Which lead is this for? *</span>
                <select
                  value={newTask.lead_id}
                  onChange={(e) => setNewTask({ ...newTask, lead_id: e.target.value })}
                  style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
                >
                  <option value="">Select a lead…</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.business_name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Task *</span>
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Follow up on pricing question"
                />
              </label>
              <label className="field">
                <span className="field-label">Due date (optional)</span>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </label>

              {error && <div className="admin-error">{error}</div>}

              <button
                className="rev-ai-btn"
                onClick={addTask}
                disabled={addingTask || !newTask.lead_id || !newTask.title.trim()}
                style={{ marginTop: '0.5rem' }}
              >
                {addingTask ? 'Adding…' : 'Add Task'}
              </button>
            </div>
          )}

          {loadingTasks ? (
            <p className="admin-page-sub">Loading…</p>
          ) : tasks.length === 0 ? (
            <p className="admin-page-sub">No tasks yet.</p>
          ) : (
            <div className="demo-list">
              {tasks.map((t) => {
                const overdue = !t.completed && t.due_date && (() => {
                  const [y, m, d] = t.due_date.split('-').map(Number)
                  const due = new Date(y, m - 1, d)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return due < today
                })()
                return (
                  <div className="response-demo-card" key={t.id} style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                      <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <div>
                        <div className={t.completed ? 'demo-card-name' : 'demo-card-name'} style={t.completed ? { textDecoration: 'line-through', color: '#9ca3af' } : undefined}>
                          {t.title}
                        </div>
                        <div className="demo-card-meta">
                          <Link href={`/sales/leads/${t.lead_id}`} style={{ color: '#C2410C' }}>
                            {t.leads?.business_name || 'Unknown lead'}
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {t.due_date && (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: overdue ? '#b23b30' : '#6b7280' }}>
                          {overdue ? 'Overdue · ' : ''}
                          {(() => {
                            const [y, m, d] = t.due_date.split('-').map(Number)
                            return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          })()}
                        </span>
                      )}
                      <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.95rem' }}>×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div className="drawer-overlay" onClick={() => setShowAdd(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>Add Lead</h2>
              <button className="drawer-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
                <label className="field">
                  <span className="field-label">Business name *</span>
                  <input value={newLead.business_name} onChange={(e) => setNewLead({ ...newLead, business_name: e.target.value })} placeholder="e.g. Mesa Dental" />
                </label>
                <div className="drawer-grid">
                  <label className="field">
                    <span className="field-label">Contact name</span>
                    <input value={newLead.contact_name} onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="field-label">Industry</span>
                    <input value={newLead.industry} onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })} placeholder="e.g. Restaurant" />
                  </label>
                  <label className="field">
                    <span className="field-label">State</span>
                    <select
                      value={newLead.state}
                      onChange={(e) => setNewLead({ ...newLead, state: e.target.value })}
                      style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
                    >
                      <option value="">— not set —</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="drawer-grid">
                  <label className="field">
                    <span className="field-label">Email</span>
                    <input type="email" value={newLead.contact_email} onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="field-label">Phone</span>
                    <input value={newLead.contact_phone} onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })} />
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">Google Maps link</span>
                  <input value={newLead.google_url} onChange={(e) => setNewLead({ ...newLead, google_url: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Yelp link</span>
                  <input value={newLead.yelp_url} onChange={(e) => setNewLead({ ...newLead, yelp_url: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Notes</span>
                  <textarea value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} style={{ minHeight: 70 }} />
                </label>

                {error && <div className="admin-error">{error}</div>}

                <button className="rev-ai-btn" onClick={() => createLead()} disabled={saving} style={{ marginTop: '0.5rem' }}>
                  {saving ? 'Adding…' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
