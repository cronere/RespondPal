'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
    industry: '', google_url: '', yelp_url: '', notes: '',
  })
  const [newTask, setNewTask] = useState({ lead_id: '', title: '', due_date: '' })
  const [addingTask, setAddingTask] = useState(false)

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

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (tab === 'open' && openLeads.length === 0) loadOpen()
    if (tab === 'clients' && clients.length === 0) loadClients()
    if (tab === 'tasks' && tasks.length === 0) loadTasks()
  }, [tab])

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
    } catch {
      loadTasks()
    }
  }

  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      await fetch(`/api/sales/tasks/${taskId}`, { method: 'DELETE' })
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
        setNewLead({ business_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', google_url: '', yelp_url: '', notes: '' })
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

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { key: 'mine', label: 'My Leads' },
          { key: 'open', label: 'Open Leads' },
          { key: 'clients', label: 'Existing Clients' },
          { key: 'tasks', label: 'Tasks' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              color: tab === t.key ? '#C2410C' : '#6b7280',
              borderBottom: tab === t.key ? '2px solid #C2410C' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {tab === 'mine' && (
        loading ? (
          <p className="admin-page-sub">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="admin-page-sub">No leads yet. Add your first one above.</p>
        ) : (
          <div className="demo-list">
            {leads.map((l) => (
              <div className="response-demo-card" key={l.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Link href={`/sales/leads/${l.id}`} style={{ textDecoration: 'none' }}>
                      <div className="demo-card-name" style={{ color: '#C2410C' }}>{l.business_name}</div>
                    </Link>
                    <div className="demo-card-meta">
                      {l.industry || 'Industry not set'}
                      {l.contact_name ? ` · ${l.contact_name}` : ''}
                      {l.contact_phone ? ` · ${l.contact_phone}` : ''}
                    </div>
                  </div>
                  <select
                    value={l.stage}
                    onChange={(e) => changeStage(l.id, e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {l.notes && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{l.notes}</div>}
              </div>
            ))}
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
          ) : (
            <div className="demo-list">
              {openLeads.map((l) => (
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
          ) : (
            <div className="demo-list">
              {clients.map((c) => (
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
          <button className="rev-ai-btn" onClick={() => setShowAddTask(true)} style={{ marginBottom: '1.25rem' }}>
            + Add Task
          </button>

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

      {showAddTask && (
        <div className="drawer-overlay" onClick={() => setShowAddTask(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="drawer-head">
              <h2>Add Task</h2>
              <button className="drawer-close" onClick={() => setShowAddTask(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
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
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="drawer-overlay" onClick={() => setShowAdd(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
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
