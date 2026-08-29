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
  { href: '/sales/performance', label: 'My Performance' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isLogin = pathname === '/sales/login'

  // Close the mobile menu automatically whenever the route changes — a
  // link tap should close the menu on its own, not leave it hanging open
  // over the new page.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isLogin) return
    let active = true
    fetch('/api/sales/me')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!active) return
        setRep(data.rep)
        // An archived rep can view their own past statements, and
        // nothing else — if they land anywhere else in Sales HQ (a
        // stale bookmark, browser back button, whatever), send them
        // back to the one place they're actually allowed.
        if (data.rep && !data.rep.active && !pathname.startsWith('/sales/statements')) {
          router.push('/sales/statements')
        }
      })
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
          <div className="admin-brand-text">Respond<span>Pal</span></div>
          <div className="admin-brand-sub">Sales HQ{rep ? ` · ${rep.name}` : ''}</div>
          <button
            className="admin-hamburger"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className={`admin-nav${mobileMenuOpen ? ' admin-nav-mobile-open' : ''}`}>
          {(rep && !rep.active ? NAV.filter((item) => item.href === '/sales/statements') : NAV).map((item) => {
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

        {rep && !rep.active && (
          <div style={{
            margin: '0 0 1rem', padding: '0.7rem 0.9rem', borderRadius: 8, fontSize: '0.78rem',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5,
          }}>
            This account has been archived. You can still view your past statements here, but the
            rest of Sales HQ isn&apos;t available. Contact Jacob with any questions.
          </div>
        )}

        <div className="admin-sidebar-footer">
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
