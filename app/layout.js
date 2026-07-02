'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/onboarding', label: 'Onboarding' },
  { href: '/admin/reviews', label: 'Reviews', badgeKey: 'reviews' },
  { href: '/admin/audits', label: 'Risk Audits', badgeKey: 'audits' },
  { href: '/admin/feedback', label: 'Feedback', badgeKey: 'feedback' },
  { href: '/admin/yelp-prep', label: 'Quick Draft' },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [counts, setCounts] = useState({ reviews: 0, feedback: 0, audits: 0 })

  const isLogin = pathname === '/admin/login'

  // Poll badge counts on mount, on route change, and every 60s.
  useEffect(() => {
    if (isLogin) return
    let active = true
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/admin/counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (active) setCounts({ reviews: data.reviews || 0, feedback: data.feedback || 0, audits: data.audits || 0 })
      } catch {
        // ignore — badges just won't update this cycle
      }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => { active = false; clearInterval(interval) }
  }, [isLogin, pathname])

  // Don't wrap the login page in the shell
  if (isLogin) {
    return children
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Respond<span>Pal</span>
          <div className="admin-brand-sub">Operations HQ</div>
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
          <a href="/" className="admin-sidebar-link" target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <button className="admin-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}
