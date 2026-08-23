'use client'

import { useState, useEffect } from 'react'

const STRIPE_LINKS = [
  { plan: '1 Location', price: '$397/mo', url: 'https://buy.stripe.com/00w7sNfC78JR3ndeo9ebu00' },
  { plan: '2 Locations', price: '$649/mo', url: 'https://buy.stripe.com/28E5kF89FbW3g9Z2Frebu01' },
  { plan: '3 Locations', price: '$897/mo', url: 'https://buy.stripe.com/00w3cx89F2lt8Hxeo9ebu02' },
  { plan: 'Cleanup add-on', price: '$197', url: 'https://buy.stripe.com/9B6fZj61x2lt7Dt7ZLebu04' },
]

export default function SalesOnboarding() {
  const [rep, setRep] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetch('/api/sales/me').then((r) => r.json()).then((d) => setRep(d.rep)).catch(() => {})
  }, [])

  const onboardingLink = rep
    ? `https://respondpal.ai/onboarding?rep=${encodeURIComponent(rep.name)}`
    : ''

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Onboard a Client</h1>
        <p className="admin-page-sub">
          Two ways to close: send the Stripe link and let them pay themselves, or stay on the call and
          walk them through it live. Either way, use your personal onboarding link below so you're
          automatically credited — no relying on them to type your name correctly.
        </p>
      </header>

      <div className="drawer-section" style={{ maxWidth: 620, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#1a1a1a' }}>
          Your personal onboarding link
        </div>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          Send this to a customer to fill out themselves, or open it yourself and walk them through it
          on the call. Your name is pre-filled and locked in automatically either way.
        </p>
        {rep ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={onboardingLink}
              readOnly
              style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem', color: '#1a1a1a', background: 'white' }}
            />
            <button className="rev-mini-btn" onClick={() => copy(onboardingLink, 'link')}>
              {copied === 'link' ? 'Copied!' : 'Copy'}
            </button>
            <a href={onboardingLink} target="_blank" rel="noreferrer" className="rev-ai-btn" style={{ whiteSpace: 'nowrap' }}>
              Open →
            </a>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Loading…</p>
        )}
      </div>

      <div className="drawer-section" style={{ maxWidth: 620 }}>
        <div className="drawer-section-label">Stripe payment links</div>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.9rem' }}>
          Text or read one of these while on the phone. 4+ locations — text Jacob directly, don't quote a price.
        </p>
        <div className="demo-list">
          {STRIPE_LINKS.map((l) => (
            <div className="response-demo-card" key={l.plan} style={{ cursor: 'default' }}>
              <div>
                <div className="demo-card-name">{l.plan}</div>
                <div className="demo-card-meta">{l.price}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="rev-mini-btn" onClick={() => copy(l.url, l.plan)}>
                  {copied === l.plan ? 'Copied!' : 'Copy Link'}
                </button>
                <a href={l.url} target="_blank" rel="noreferrer" className="rev-mini-btn">
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
