// RespondPal — Healthcare / HIPAA & Privacy page
// Drop into the existing respondpal-site app at: app/healthcare/page.js
// Relies on app/globals.css already being loaded by the root layout — this file
// reuses real site classes (nav, footer, final-cta, ai-cards, compare-sec, demo-card,
// etc.) and CSS variables directly rather than defining its own parallel system,
// so it stays in sync with the rest of the site automatically.
// Local <style> below covers only the handful of elements with no existing
// equivalent on the main site (the principle-row divider list, the guard list,
// and the fine-amount cards).
'use client'
import Image from 'next/image'

const localStyles = `
  .hc-principle-list { margin-top: 2.5rem; }
  .hc-principle-row { padding: 1.35rem 0; border-top: 1px solid var(--border); }
  .hc-principle-row:first-child { border-top: none; padding-top: 0; }
  .hc-principle-row h3 { font-size: 1rem; font-weight: 700; color: var(--white); margin-bottom: 0.35rem; }
  .hc-principle-row p { font-size: 0.9rem; color: var(--muted); line-height: 1.65; max-width: 42em; }

  .hc-guard-list { margin-top: 2.5rem; }
  .hc-guard-row { display: flex; gap: 1rem; padding: 1.15rem 0; border-top: 1px solid var(--border); }
  .hc-guard-row:first-child { border-top: none; padding-top: 0; }
  .hc-guard-icon {
    flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid var(--red); color: var(--red);
    display: flex; align-items: center; justify-content: center; margin-top: 2px;
  }
  .hc-guard-row h3 { font-size: 0.95rem; font-weight: 700; color: var(--white); margin-bottom: 0.3rem; }
  .hc-guard-row p { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }

  .hc-fines-section { background: #ffffff; padding: 5rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .hc-fines-section .section-h2 { color: var(--light-text); }
  .hc-fines-section .section-sub { color: var(--light-muted); }
  .hc-fines-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px;
    background: var(--border); border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden; margin-top: 2.5rem;
  }
  .hc-fine-card { background: var(--black); padding: 1.75rem; }
  .hc-fine-amount { font-family: var(--font-display); font-size: 2.3rem; font-weight: 800; color: var(--red); line-height: 1; }
  .hc-fine-meta { font-size: 0.75rem; color: var(--muted); margin-top: 0.6rem; }
  .hc-fine-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.55; margin-top: 0.5rem; }
  .hc-fines-note { text-align: center; margin-top: 2rem; font-size: 0.95rem; color: var(--light-muted); }

  .hc-legal-band { background: var(--card); padding: 5rem 0; }
  .hc-legal-band p { color: var(--text); max-width: 42em; margin: 0 auto; text-align: left; font-size: 0.95rem; line-height: 1.7; }
  .hc-legal-band p + p { margin-top: 1rem; }
  .hc-legal-note { color: var(--muted) !important; font-size: 0.875rem !important; }
`

export default function HealthcarePage() {
  return (
    <main>
      <style>{localStyles}</style>

      {/* NAV — identical to the main site nav */}
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          <div className="desktop-links">
            <a href="/#how">How it works</a>
            <a href="/#different">Our AI</a>
            <a href="/#features">What&apos;s included</a>
            <a href="/#pricing">Pricing</a>
            <a href="/details">Details</a>
            <a href="/#pricing" className="nav-cta">Get started</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">For healthcare practices</div>
          <h1>
            Silence isn&apos;t<br /><em>a HIPAA strategy.</em>
          </h1>
          <p className="hero-sub">
            Most healthcare practices skip the review conversation entirely, worried that one wrong
            sentence in a public reply could disclose something it shouldn&apos;t. RespondPal writes
            responses built, from the first draft, to never say the things HIPAA protects.
          </p>

          <div className="demo-card" style={{ textAlign: 'left' }}>
            <div className="review-item">
              <div className="review-meta">
                <span className="avatar neg">R</span>
                <div>
                  <div className="reviewer-name">Review · Google</div>
                  <div className="stars low">★★☆☆☆</div>
                </div>
              </div>
              <p className="review-text">
                &ldquo;I felt rushed during my appointment and my concerns weren&apos;t taken seriously.
                Won&apos;t be coming back.&rdquo;
              </p>
              <div className="response-box">
                <div className="response-label">RespondPal&apos;s draft</div>
                <p className="response-text">
                  Thank you for taking the time to share this. Feeling rushed or unheard is never the
                  experience we want for anyone who visits us. We&apos;d welcome the chance to talk more
                  directly — please reach out to our office at your convenience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY PRACTICES GO QUIET */}
      <section className="ai-section">
        <div className="container">
          <div className="section-label">Why practices go quiet</div>
          <h2 className="section-h2">Silence has a cost too.</h2>
          <p className="section-sub">
            It usually starts the same way. Someone on staff drafts a reply, reads it back, and realizes
            it confirms more than it should — that the person was a patient, what they came in for, what
            they were charged. So the reply gets deleted, and the review sits there unanswered, sometimes
            for months. Unanswered negative reviews tend to outrank the ones a practice has responded to,
            and they&apos;re often the first thing a prospective patient reads.
          </p>
          <p className="section-sub" style={{ marginTop: '1rem' }}>
            And it&apos;s not just future patients reading what gets posted. Google&apos;s AI Overviews,
            ChatGPT, and Perplexity read review responses too when deciding how to describe and recommend
            a business. A privacy-violating response doesn&apos;t just land badly with the one person who
            reads it — it can shape how AI characterizes the practice to everyone who asks.
          </p>
        </div>
      </section>

      {/* THIS ISN'T HYPOTHETICAL — the one full white section */}
      <section className="hc-fines-section">
        <div className="container">
          <div className="section-label">This isn&apos;t hypothetical</div>
          <h2 className="section-h2">Regulators have already fined practices for this.</h2>
          <p className="section-sub">
            Not for a data breach, not for a hack — for what someone typed in reply to a bad review.
          </p>
          <div className="hc-fines-grid">
            <div className="hc-fine-card">
              <div className="hc-fine-amount">$23,000</div>
              <div className="hc-fine-meta">New Vision Dental — California, 2022</div>
              <p className="hc-fine-desc">Disclosed a patient&apos;s name, treatment, and insurance details in responses to Yelp reviews.</p>
            </div>
            <div className="hc-fine-card">
              <div className="hc-fine-amount">$50,000</div>
              <div className="hc-fine-meta">U. Phillip Igbinadolor, D.M.D. — North Carolina, 2022</div>
              <p className="hc-fine-desc">Named a patient and their treatment in a single response to a negative online review.</p>
            </div>
            <div className="hc-fine-card">
              <div className="hc-fine-amount">$30,000</div>
              <div className="hc-fine-meta">Manasa Health Center — New Jersey, 2023</div>
              <p className="hc-fine-desc">Disclosed a patient&apos;s mental health diagnosis in a response to a Google review.</p>
            </div>
          </div>
          <p className="hc-fines-note">
            Every one of these traces back to the same instinct — wanting to set the record straight in
            public. It&apos;s exactly the instinct RespondPal is built to override.
          </p>
        </div>
      </section>

      {/* HOW RESPONDPAL SOLVES IT */}
      <section className="ai-section" id="different">
        <div className="container">
          <div className="section-label">How we&apos;re different</div>
          <h2 className="section-h2">Every response stays inside the line.</h2>
          <p className="section-sub">
            Practices in HIPAA-sensitive fields — dental, medical, mental health, med spa, and similar —
            are recognized automatically and drafted under tighter rules than a typical business gets.
          </p>
          <div className="ai-cards">
            <div className="ai-card">
              <div className="ai-card-icon">🔒</div>
              <h3>Works only from what&apos;s public</h3>
              <p>Every draft is built from the review text itself. RespondPal never connects to your EHR, practice management system, or billing platform.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">⚖️</div>
              <h3>Neutral by design</h3>
              <p>Responses acknowledge feedback without confirming or disputing the reviewer&apos;s account — a practice replying publicly can never verify what happened privately.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">🧠</div>
              <h3>Calibrated on real reviews</h3>
              <p>Rules were built and refined against real reviews from dental, med spa, and family law practices — not written from a generic checklist.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">👤</div>
              <h3>Screened before it posts</h3>
              <p>Every draft is automatically checked for phrasing that could imply patient status, treatment, or billing information before it goes live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BAA */}
      <section className="hc-legal-band">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label">The legal question</div>
          <h2 className="section-h2">Do we need a Business Associate Agreement?</h2>
          <p style={{ margin: '1.5rem auto 0' }}>
            Short answer: no. We had outside healthcare-specialized counsel evaluate RespondPal
            specifically against HIPAA&apos;s definition of a business associate. Because the system only
            processes information a reviewer has already made public — and never accesses, stores, or
            transmits protected health information from your systems — RespondPal doesn&apos;t meet that
            definition.
          </p>
          <p className="hc-legal-note">
            If your compliance officer or attorney wants to see the underlying analysis directly,
            we&apos;re glad to send it — just ask.
          </p>
        </div>
      </section>

      {/* WHAT WE NEVER DO */}
      <section className="compare-sec">
        <div className="container">
          <div className="section-label">The guardrails</div>
          <h2 className="section-h2">What a RespondPal response will never do.</h2>
          <div className="hc-guard-list" style={{ maxWidth: 680, margin: '2.5rem auto 0' }}>
            <div className="hc-guard-row">
              <div className="hc-guard-icon">✕</div>
              <div>
                <h3>Confirm that someone is, or ever was, a patient</h3>
                <p>No &ldquo;our patient,&rdquo; no &ldquo;your visit on [date]&rdquo; — even when it would read as more personal or polite.</p>
              </div>
            </div>
            <div className="hc-guard-row">
              <div className="hc-guard-icon">✕</div>
              <div>
                <h3>Suggest a records search took place</h3>
                <p>Not even to deny something. A denial can confirm just as much as an admission.</p>
              </div>
            </div>
            <div className="hc-guard-row">
              <div className="hc-guard-icon">✕</div>
              <div>
                <h3>Reference treatment, diagnosis, or medication</h3>
                <p>No procedures, conditions, or prescriptions — regardless of what the reviewer disclosed.</p>
              </div>
            </div>
            <div className="hc-guard-row">
              <div className="hc-guard-icon">✕</div>
              <div>
                <h3>Reference appointment specifics</h3>
                <p>No dates, times, or which provider someone saw.</p>
              </div>
            </div>
            <div className="hc-guard-row">
              <div className="hc-guard-icon">✕</div>
              <div>
                <h3>Reference billing, payment, or insurance</h3>
                <p>No confirmation of what was charged, paid, or covered.</p>
              </div>
            </div>
            <div className="hc-guard-row">
              <div className="hc-guard-icon">✕</div>
              <div>
                <h3>Dispute the reviewer&apos;s account</h3>
                <p>A public reply can&apos;t verify what happened in a private appointment, so responses acknowledge feedback without contesting it.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLE — reuses the real compare-sec / compare-col pattern */}
      <section className="compare-sec" style={{ background: 'var(--black)' }}>
        <div className="container">
          <div className="section-label">In practice</div>
          <h2 className="section-h2">The same review, handled two ways.</h2>
          <p className="section-sub">
            &ldquo;Called ahead about my insurance coverage and was told everything was fine, then got a
            huge bill after my visit. Feels like a bait and switch.&rdquo;
          </p>
          <div className="compare-grid">
            <div className="compare-col bad">
              <h4>A common instinct</h4>
              <ul className="clist">
                <li>&ldquo;Our records show your visit was verified with your insurance provider on March 4th...&rdquo;</li>
                <li>Confirms a records search and a specific visit date</li>
                <li>Confirms billing and insurance details, publicly</li>
              </ul>
            </div>
            <div className="compare-col good">
              <h4>What RespondPal drafts</h4>
              <ul className="clist">
                <li>&ldquo;We&apos;re sorry to hear this — billing questions are always worth a closer look. Please reach out to our office directly.&rdquo;</li>
                <li>Acknowledges the frustration and invites resolution</li>
                <li>Confirms nothing about the visit, billing, or coverage</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — real final-cta class: orange bg, watermark, white h2/p all inherited */}
      <section className="final-cta" id="pricing">
        <div className="container">
          <h2>See what this looks like<br />for your practice.</h2>
          <p>
            We&apos;ll pull your practice&apos;s actual Google and Yelp reviews, flag anything that
            carries privacy risk, and show you exactly where you stand.
          </p>
          <a
            href="https://www.respondpal.ai/#pricing"
            className="btn-outline"
            style={{ background: 'white', color: '#111827', borderColor: 'white', fontWeight: 700 }}
          >
            Get started →
          </a>
        </div>
      </section>

      {/* FOOTER — identical to the main site footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>&copy; {new Date().getFullYear()} RespondPal LLC · respondpal.ai</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/details">How it works</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
