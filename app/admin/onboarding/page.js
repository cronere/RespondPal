'use client'

import { useState, useEffect } from 'react'

// The checklist items shown per client. `auto` items reflect real client
// fields (read-only mirrors); manual items are stored in onboarding_checklist.
const CHECKLIST = [
  { key: 'voice_configured', label: 'Brand voice configured', auto: (c) => !!c.response_signer || !!c.response_tone },
  { key: 'google_accepted', label: 'Google Manager invite accepted', auto: (c) => !!c.google_access },
  { key: 'yelp_accepted', label: 'Yelp Team Member invite accepted', auto: (c) => !!c.yelp_access },
  { key: 'first_response_posted', label: 'First response drafted/posted', manual: true },
  { key: 'cleanup_started', label: 'Profile Cleanup started (if purchased)', manual: true },
]

export default function AdminOnboarding() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (res.ok) setClients(data.clients)
      else setError(data.error || 'Failed to load.')
    } catch {
      setError('Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Only clients still onboarding
  const onboarding = clients.filter((c) => c.status === 'onboarding')

  const updateClient = (updated) =>
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head">
        <h1>Onboarding</h1>
        <p className="admin-page-sub">
          {loading ? 'Loading…' : `${onboarding.length} client${onboarding.length === 1 ? '' : 's'} in onboarding`}
        </p>
      </header>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="clients-empty">Loading…</div>
      ) : onboarding.length === 0 ? (
        <div className="clients-empty">No clients in onboarding right now. New signups appear here automatically.</div>
      ) : (
        <div className="onb-list">
          {onboarding.map((c) => (
            <OnboardingCard key={c.id} client={c} onUpdate={updateClient} />
          ))}
        </div>
      )}
    </div>
  )
}

function OnboardingCard({ client, onUpdate }) {
  const [checklist, setChecklist] = useState(client.onboarding_checklist || {})
  const [savingItem, setSavingItem] = useState(null)
  const [goingLive, setGoingLive] = useState(false)
  const [message, setMessage] = useState(null)

  const hasCleanup = client.plan === 'monthly_plus_cleanup' || client.plan === 'cleanup_only'

  const isChecked = (item) => {
    if (item.auto) return item.auto(client)
    return !!checklist[item.key]
  }

  const toggleManual = async (item) => {
    if (item.auto) return // auto items aren't manually toggled
    const next = { ...checklist, [item.key]: !checklist[item.key] }
    setChecklist(next)
    setSavingItem(item.key)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_checklist: next }),
      })
      const data = await res.json()
      if (res.ok) onUpdate(data.client)
    } catch {
      // revert on failure
      setChecklist(checklist)
    }
    setSavingItem(null)
  }

  const requiredDone = client.google_access && client.yelp_access

  const handleGoLive = async () => {
    if (goingLive) return
    setGoingLive(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/go-live`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Client is now live. Emails sent.' })
        onUpdate(data.client)
      } else {
        setMessage({ type: 'error', text: data.error || 'Go-live failed.' })
        setGoingLive(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Go-live failed.' })
      setGoingLive(false)
    }
  }

  return (
    <div className="onb-card">
      <div className="onb-card-head">
        <div>
          <h3>{client.business_name}</h3>
          <p className="onb-card-sub">
            {client.owner_name} · {client.email}
            {hasCleanup && <span className="onb-tag">+ Cleanup</span>}
          </p>
        </div>
        <div className="onb-card-meta">
          {client.locations} loc · {client.rep_name ? `Rep: ${client.rep_name}` : 'No rep'}
        </div>
      </div>

      <div className="onb-checklist">
        {CHECKLIST.map((item) => {
          // hide cleanup item if not purchased
          if (item.key === 'cleanup_started' && !hasCleanup) return null
          const checked = isChecked(item)
          return (
            <button
              key={item.key}
              className={`onb-check${checked ? ' done' : ''}${item.auto ? ' auto' : ''}`}
              onClick={() => toggleManual(item)}
              disabled={item.auto || savingItem === item.key}
              title={item.auto ? 'Reflects the client record automatically' : 'Click to toggle'}
            >
              <span className="onb-check-box">{checked ? '✓' : ''}</span>
              <span className="onb-check-label">{item.label}</span>
              {item.auto && <span className="onb-check-auto">auto</span>}
            </button>
          )
        })}
      </div>

      {message && (
        <div className={`onb-message ${message.type}`}>{message.text}</div>
      )}

      <div className="onb-card-foot">
        {!requiredDone && (
          <p className="onb-hint">
            Accept the Google &amp; Yelp invites (toggle access on the client in the Clients tab, or it reflects here once granted) before going live.
          </p>
        )}
        <button
          className="onb-golive-btn"
          onClick={handleGoLive}
          disabled={!requiredDone || goingLive}
        >
          {goingLive ? 'Going live…' : 'Go Live →'}
        </button>
      </div>
    </div>
  )
}
