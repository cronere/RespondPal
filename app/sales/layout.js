'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/sales', label: 'Dashboard', exact: true },
  { href: '/sales/toolkit', label: 'Sales Toolkit' },
  { href: '/sales/leads', label: 'My Leads', badgeKey: 'tasksDue' },
  { href: '/sales/audit-request', label: 'Request Audit', badgeKey: 'auditsReady' },
  { href: '/sales/commissions', label: 'My Commissions' },
  { href: '/sales/statements', label: 'Statements' },
  { href: '/sales/response-examples', label: 'Response Examples' },
  { href: '/sales/onboarding', label: 'Onboard a Client' },
  { href: '/sales/settings', label: 'Settings' },
]

export default function SalesLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [rep, setRep] = useState(null)
  const [counts, setCounts] = useState({ tasksDue: 0, auditsReady: 0 })

  const isLogin = pathname === '/sales/login'

  useEffect(() => {
    if (isLogin) return
    let active = true
    fetch('/api/sales/me')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (active) setRep(data.rep) })
      .catch(() => { if (active) router.push('/sales/login') })
    return () => { active = false }
  }, [isLogin, pathname, router])

  // Poll badge counts on mount, on route change, and every 60s — same
  // pattern as admin HQ's sidebar.
  useEffect(() => {
    if (isLogin) return
    let active = true
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/sales/counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (active) setCounts({ tasksDue: data.tasksDue || 0, auditsReady: data.auditsReady || 0 })
      } catch {
        // ignore — badges just won't update this cycle
      }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => { active = false; clearInterval(interval) }
  }, [isLogin, pathname])

  const handleLogout = async () => {
    await fetch('/api/sales/auth', { method: 'DELETE' })
    router.push('/sales/login')
    router.refresh()
  }

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  if (isLogin) {
    return children
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Respond<span>Pal</span>
          <div className="admin-brand-sub">Sales HQ{rep ? ` · ${rep.name}` : ''}</div>
        </div>

        <nav className="admin-nav">
          {NAV.map((item) => {
            const badge = item.badgeKey ? counts[item.badgeKey] : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${isActive(item) ? ' active' : ''}`}
              >
                <span>{item.label}</span>
                {badge > 0 && <span className="admin-nav-badge">{badge}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="sidebar-help-block" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '0.2rem' }}>Need help?</div>
            <div>Jacob Merkley</div>
            <a href="mailto:jacob@respondpal.ai" style={{ color: 'rgba(255,255,255,0.55)' }}>jacob@respondpal.ai</a>
            <div><a href="tel:4805006642" style={{ color: 'rgba(255,255,255,0.55)' }}>480-500-6642</a></div>
          </div>
          <a href="tel:4805006642" className="sidebar-help-compact admin-sidebar-link" aria-label="Call Jacob for help">
            📞 Help
          </a>
          <a href="/" className="admin-sidebar-link" target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <button className="admin-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
