'use client'

import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Dashboard</h1>
        <p className="admin-page-sub">
          Your operations hub — manage clients, run onboarding, and respond to reviews.
        </p>
      </header>

      <div className="admin-cards">
        <Link href="/admin/clients" className="admin-card">
          <div className="admin-card-label">Clients</div>
          <p>Every client, their plan, status, and access. Your at-a-glance roster.</p>
          <span className="admin-card-cta">Open clients →</span>
        </Link>

        <Link href="/admin/onboarding" className="admin-card">
          <div className="admin-card-label">Onboarding</div>
          <p>Per-client setup checklists. Take a new client live in a few clicks.</p>
          <span className="admin-card-cta">Open onboarding →</span>
        </Link>

        <Link href="/admin/reviews" className="admin-card">
          <div className="admin-card-label">Reviews</div>
          <p>The response queue. See what needs a reply and post it.</p>
          <span className="admin-card-cta">Open reviews →</span>
        </Link>

        <Link href="/admin/yelp-prep" className="admin-card">
          <div className="admin-card-label">Yelp Prep</div>
          <p>Draft on-brand Yelp responses to copy over while manual.</p>
          <span className="admin-card-cta">Open Yelp prep →</span>
        </Link>
      </div>

      <div className="admin-note">
        <strong>Stage 1 is live.</strong> The shell and navigation are in place. Client
        data, onboarding actions, and the review tools come online in the next stages.
      </div>
    </div>
  )
}
