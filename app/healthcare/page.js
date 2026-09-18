// RespondPal — Healthcare / HIPAA & Privacy page
// Drop into a Next.js app:
//   App Router:   app/healthcare/page.js  (export default component below works as-is)
//   Pages Router: pages/healthcare.js
// No external dependencies beyond the Google Fonts loaded in <head> below.
// CTA links point to mailto:hello@respondpal.ai — update to your real signup/booking link before publishing.

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');

  .hc-page {
    --bg: #0A0A0A;
    --bg-alt: #111318;
    --card: #16191F;
    --border: #1E2128;
    --orange: #FF5C1A;
    --orange-light: #FF7A40;
    --orange-glow: rgba(255,92,26,0.12);
    --white: #F4F2ED;
    --muted: #7A7F8E;
    --red: #EF4444;
    --red-glow: rgba(239,68,68,0.12);
    --display: 'Bebas Neue', sans-serif;
    --mono: 'DM Mono', monospace;
    --body: 'DM Sans', sans-serif;

    background: var(--bg);
    color: var(--white);
    font-family: var(--body);
    font-size: 17px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .hc-page * { box-sizing: border-box; }
  .hc-page p { margin: 0; }
  .hc-page a { color: var(--orange); }
  .hc-page a:hover { color: var(--orange-light); }
  .hc-page *:focus-visible { outline: 2px solid var(--orange); outline-offset: 3px; }

  .hc-h1, .hc-h2 {
    font-family: var(--display);
    font-weight: 400;
    color: var(--white);
    letter-spacing: 0.3px;
    margin: 0;
  }

  .hc-band { width: 100%; }
  .hc-band-inner { max-width: 660px; margin: 0 auto; padding: 84px 24px; }
  .hc-band-wide .hc-band-inner { max-width: 980px; }
  .hc-band-alt { background: var(--bg-alt); }

  /* Nav */
  .hc-nav {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 980px;
    margin: 0 auto;
    padding: 20px 24px;
    background: rgba(10,10,10,0.9);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }
  .hc-logo {
    font-family: var(--display);
    font-size: 24px;
    letter-spacing: 0.5px;
    color: var(--white);
    text-decoration: none;
  }
  .hc-logo span { color: var(--orange); }
  .hc-nav-cta {
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 500;
    text-decoration: none;
    color: var(--white);
    border: 1px solid var(--border);
    padding: 9px 16px;
    border-radius: 6px;
    transition: border-color 0.15s, color 0.15s;
  }
  .hc-nav-cta:hover { border-color: var(--orange); color: var(--orange); }

  /* Hero */
  .hc-hero .hc-band-inner { padding-top: 80px; padding-bottom: 64px; }
  .hc-h1 {
    font-size: clamp(2.6rem, 1.9rem + 3vw, 4rem);
    line-height: 1.05;
  }
  .hc-hero-sub {
    margin-top: 22px;
    max-width: 40em;
    font-size: 1.08rem;
    color: var(--muted);
  }

  .hc-reveal { opacity: 1; }
  @media (prefers-reduced-motion: no-preference) {
    .hc-reveal { opacity: 0; animation: hcFadeUp 0.65s ease both; }
    .hc-reveal:nth-of-type(1) { animation-delay: 0.02s; }
    .hc-reveal:nth-of-type(2) { animation-delay: 0.14s; }
    .hc-reveal:nth-of-type(3) { animation-delay: 0.26s; }
  }
  @keyframes hcFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Demo card */
  .hc-demo {
    margin-top: 44px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 30px 32px;
  }
  .hc-demo-stars { font-size: 0.9rem; color: var(--muted); margin-bottom: 8px; }
  .hc-demo-review { font-size: 0.98rem; color: var(--muted); font-style: italic; }
  .hc-demo-divider { height: 1px; background: var(--border); margin: 22px 0; }
  .hc-demo-label {
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 10px;
  }
  .hc-demo-response { font-size: 1rem; color: var(--white); }
  .hc-demo-notes {
    display: flex;
    flex-wrap: wrap;
    margin-top: 24px;
    border-top: 1px solid var(--border);
    padding-top: 18px;
  }
  .hc-demo-note {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.85rem;
    color: var(--muted);
    padding: 4px 18px 4px 0;
    margin-right: 18px;
    border-right: 1px solid var(--border);
  }
  .hc-demo-note:last-child { border-right: none; margin-right: 0; }
  .hc-icon-ok { color: var(--orange); flex-shrink: 0; }
  .hc-icon-no { color: var(--red); flex-shrink: 0; }

  /* Section headings */
  .hc-h2 { font-size: clamp(1.7rem, 1.3rem + 1.4vw, 2.3rem); line-height: 1.15; max-width: 22em; }
  .hc-lede { margin-top: 16px; color: var(--muted); max-width: 42em; }
  .hc-body { margin-top: 40px; }
  .hc-prose { color: var(--muted); max-width: 42em; }
  .hc-prose p + p { margin-top: 16px; }

  /* Principles */
  .hc-principle { padding: 22px 0; border-top: 1px solid var(--border); }
  .hc-principle:first-child { border-top: none; padding-top: 0; }
  .hc-principle-title { font-weight: 600; font-size: 1.02rem; color: var(--white); }
  .hc-principle-desc { margin-top: 6px; color: var(--muted); max-width: 42em; }

  /* Legal band */
  .hc-band-legal { background: var(--card); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .hc-legal-body { margin-top: 24px; }
  .hc-legal-body p { color: var(--white); max-width: 42em; }
  .hc-legal-body p + p { margin-top: 16px; }
  .hc-legal-note { margin-top: 26px; font-size: 0.92rem; color: var(--muted); }

  /* Fines proof section */
  .hc-fines {
    margin-top: 44px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  @media (min-width: 760px) { .hc-fines { grid-template-columns: repeat(3, 1fr); } }
  .hc-fine-card { background: var(--card); padding: 28px 26px; }
  .hc-fine-amount { font-family: var(--display); font-size: 2.4rem; color: var(--red); line-height: 1; }
  .hc-fine-meta { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.5px; color: var(--muted); margin-top: 10px; }
  .hc-fine-desc { margin-top: 10px; font-size: 0.88rem; color: var(--muted); }
  .hc-fines-note { margin-top: 24px; color: var(--muted); max-width: 42em; }

  /* Guard list */
  .hc-guard-item { display: flex; gap: 16px; padding: 20px 0; border-top: 1px solid var(--border); }
  .hc-guard-item:first-child { border-top: none; padding-top: 0; }
  .hc-guard-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--red);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--red);
    margin-top: 2px;
  }
  .hc-guard-title { font-weight: 600; color: var(--white); }
  .hc-guard-desc { margin-top: 4px; color: var(--muted); }

  /* Compare */
  .hc-compare { margin-top: 44px; display: grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 760px) { .hc-compare { grid-template-columns: 1fr 1fr; gap: 32px; } }
  .hc-compare-col { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 26px 28px; }
  .hc-compare-heading {
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 500;
    margin-bottom: 16px;
  }
  .hc-compare-heading.risky { color: var(--red); }
  .hc-compare-heading.safe { color: var(--orange); }
  .hc-compare-review {
    font-size: 0.92rem;
    color: var(--muted);
    font-style: italic;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .hc-compare-response { font-size: 0.97rem; color: var(--white); }
  .hc-flag { background: var(--red-glow); color: var(--red); padding: 1px 4px; border-radius: 3px; }
  .hc-compare-callouts { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }
  .hc-compare-callout { display: flex; align-items: flex-start; gap: 8px; font-size: 0.86rem; color: var(--muted); margin-top: 8px; }
  .hc-compare-callout:first-child { margin-top: 0; }
  .hc-compare-callout svg { margin-top: 2px; flex-shrink: 0; }

  /* CTA */
  .hc-cta-band { background: var(--card); border-top: 1px solid var(--border); }
  .hc-cta-band .hc-h2 { max-width: 18em; }
  .hc-btn {
    display: inline-block;
    margin-top: 32px;
    padding: 15px 30px;
    background: var(--orange);
    color: #0A0A0A;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.98rem;
    border-radius: 6px;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .hc-btn:hover { background: var(--orange-light); color: #0A0A0A; box-shadow: 0 0 0 6px var(--orange-glow); }
  .hc-cta-fine { margin-top: 20px; font-size: 0.88rem; color: var(--muted); }
  .hc-cta-fine a { color: var(--muted); text-decoration: underline; }
  .hc-cta-fine a:hover { color: var(--white); }

  /* Footer */
  .hc-footer .hc-band-inner {
    padding-top: 40px;
    padding-bottom: 40px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.86rem;
    color: var(--muted);
  }
  .hc-footer a { color: var(--muted); text-decoration: underline; }
  .hc-footer a:hover { color: var(--white); }
`;

function IconOk({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNo({ className, size }) {
  const s = size || 12;
  return (
    <svg className={className} width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.6" />
      <line x1="4.2" y1="11.8" x2="11.8" y2="4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function HealthcarePage() {
  return (
    <div className="hc-page">
      <style>{styles}</style>

      <nav className="hc-nav">
        <a className="hc-logo" href="/">RESPOND<span>PAL</span></a>
        <a className="hc-nav-cta" href="#get-started">Get started</a>
      </nav>

      <header className="hc-band hc-hero">
        <div className="hc-band-inner">
          <h1 className="hc-h1 hc-reveal">Silence isn&apos;t a HIPAA strategy.</h1>
          <p className="hc-hero-sub hc-reveal">
            Most healthcare practices skip the review conversation entirely, worried that one wrong sentence in a
            public reply could disclose something it shouldn&apos;t. That silence has a cost of its own. RespondPal
            writes responses built, from the first draft, to never say the things HIPAA protects.
          </p>

          <div className="hc-demo hc-reveal">
            <div className="hc-demo-stars">★★☆☆☆</div>
            <p className="hc-demo-review">
              &ldquo;I felt rushed during my appointment and my concerns weren&apos;t taken seriously. Won&apos;t be
              coming back.&rdquo;
            </p>
            <div className="hc-demo-divider" />
            <div className="hc-demo-label">RespondPal&apos;s draft</div>
            <p className="hc-demo-response">
              Thank you for taking the time to share this. Feeling rushed or unheard is never the experience we want
              for anyone who visits us. We&apos;d welcome the chance to talk more directly &mdash; please reach out
              to our office whenever works for you.
            </p>
            <div className="hc-demo-notes">
              <div className="hc-demo-note"><IconOk className="hc-icon-ok" />No patient status confirmed</div>
              <div className="hc-demo-note"><IconOk className="hc-icon-ok" />No visit or treatment details</div>
              <div className="hc-demo-note"><IconOk className="hc-icon-ok" />No records referenced</div>
            </div>
          </div>
        </div>
      </header>

      <section className="hc-band hc-band-alt">
        <div className="hc-band-inner">
          <h2 className="hc-h2">Why practices go quiet</h2>
          <div className="hc-body hc-prose">
            <p>
              It usually starts the same way. Someone on staff drafts a reply, reads it back, and realizes it
              confirms more than it should &mdash; that the person was a patient, what they came in for, what they
              were charged. So the reply gets deleted, and the review sits there unanswered, sometimes for months.
            </p>
            <p>
              That silence has a cost most practices don&apos;t see directly. Unanswered negative reviews tend to
              outrank the ones a practice has responded to, and they&apos;re often the first thing a prospective
              patient reads. A practice that never engages doesn&apos;t look like it&apos;s protecting privacy
              &mdash; it just looks like it doesn&apos;t care. The truth is usually that it never had a safe way to
              reply.
            </p>
            <p>
              And it&apos;s not just future patients reading what gets posted. Google&apos;s AI Overviews, ChatGPT,
              and Perplexity read review responses too when they decide how to describe and recommend a business.
              A combative or privacy-violating response doesn&apos;t just land badly with the one person who reads
              it &mdash; it can shape how AI characterizes the practice to everyone who asks.
            </p>
          </div>
        </div>
      </section>

      <section className="hc-band">
        <div className="hc-band-inner">
          <h2 className="hc-h2">This isn&apos;t hypothetical</h2>
          <p className="hc-lede">
            Federal regulators have already fined practices for exactly this &mdash; not for a data breach, not
            for a hack, but for what someone typed in reply to a bad review.
          </p>
          <div className="hc-fines">
            <div className="hc-fine-card">
              <div className="hc-fine-amount">$23,000</div>
              <div className="hc-fine-meta">New Vision Dental &mdash; California, 2022</div>
              <p className="hc-fine-desc">
                Disclosed a patient&apos;s name, treatment, and insurance details in responses to Yelp reviews.
              </p>
            </div>
            <div className="hc-fine-card">
              <div className="hc-fine-amount">$50,000</div>
              <div className="hc-fine-meta">U. Phillip Igbinadolor, D.M.D. &mdash; North Carolina, 2022</div>
              <p className="hc-fine-desc">
                Named a patient and their treatment in a single response to a negative online review.
              </p>
            </div>
            <div className="hc-fine-card">
              <div className="hc-fine-amount">$30,000</div>
              <div className="hc-fine-meta">Manasa Health Center &mdash; New Jersey, 2023</div>
              <p className="hc-fine-desc">
                Disclosed a patient&apos;s mental health diagnosis in a response to a Google review.
              </p>
            </div>
          </div>
          <p className="hc-fines-note">
            Every one of these traces back to the same instinct &mdash; wanting to set the record straight in
            public. It&apos;s exactly the instinct RespondPal is built to override.
          </p>
        </div>
      </section>

      <section className="hc-band hc-band-alt">
        <div className="hc-band-inner">
          <h2 className="hc-h2">How RespondPal keeps every response inside the line</h2>
          <div className="hc-body">
            <div className="hc-principle">
              <div className="hc-principle-title">Works only from what&apos;s already public</div>
              <p className="hc-principle-desc">
                Every draft is built from the review text itself. RespondPal never connects to your EHR, practice
                management system, or billing platform &mdash; and never needs to.
              </p>
            </div>
            <div className="hc-principle">
              <div className="hc-principle-title">Held to a stricter standard automatically</div>
              <p className="hc-principle-desc">
                Practices in HIPAA-sensitive fields &mdash; dental, medical, mental health, med spa, and similar
                &mdash; are recognized automatically and drafted under tighter rules than a typical business gets.
                Those rules were built and refined against real reviews from practices in fields like dental, med
                spa, and family law, not written from a checklist.
              </p>
            </div>
            <div className="hc-principle">
              <div className="hc-principle-title">Neutral by design</div>
              <p className="hc-principle-desc">
                Responses acknowledge feedback without confirming or disputing the reviewer&apos;s account, because
                a practice replying publicly is never in a position to verify what happened privately &mdash; and
                trying to is where most privacy mistakes start.
              </p>
            </div>
            <div className="hc-principle">
              <div className="hc-principle-title">Screened before it&apos;s ever posted</div>
              <p className="hc-principle-desc">
                Every draft is automatically checked for phrasing that could imply patient status, treatment, or
                billing information before it goes live.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hc-band hc-band-legal">
        <div className="hc-band-inner">
          <h2 className="hc-h2">Do we need a Business Associate Agreement?</h2>
          <div className="hc-legal-body">
            <p>
              Short answer: no. We had outside healthcare-specialized counsel evaluate RespondPal specifically
              against HIPAA&apos;s definition of a business associate. Because the system only processes information
              a reviewer has already made public &mdash; and never accesses, stores, or transmits protected health
              information from your systems &mdash; RespondPal doesn&apos;t meet that definition.
            </p>
            <p className="hc-legal-note">
              If your compliance officer or attorney wants to see the underlying analysis directly, we&apos;re glad
              to send it &mdash; just ask.
            </p>
          </div>
        </div>
      </section>

      <section className="hc-band hc-band-alt">
        <div className="hc-band-inner">
          <h2 className="hc-h2">What a RespondPal response will never do</h2>
          <div className="hc-body">
            <div className="hc-guard-item">
              <div className="hc-guard-icon"><IconNo /></div>
              <div>
                <div className="hc-guard-title">Confirm that someone is, or ever was, a patient</div>
                <p className="hc-guard-desc">
                  No &ldquo;our patient,&rdquo; no &ldquo;your visit on [date]&rdquo; &mdash; even when it would
                  read as more personal or polite.
                </p>
              </div>
            </div>
            <div className="hc-guard-item">
              <div className="hc-guard-icon"><IconNo /></div>
              <div>
                <div className="hc-guard-title">Suggest a records search took place</div>
                <p className="hc-guard-desc">
                  Not even to deny something. A denial can confirm just as much as an admission &mdash; &ldquo;we
                  have no record of this&rdquo; is still a statement about who is and isn&apos;t in the system.
                </p>
              </div>
            </div>
            <div className="hc-guard-item">
              <div className="hc-guard-icon"><IconNo /></div>
              <div>
                <div className="hc-guard-title">Reference treatment, diagnosis, or medication</div>
                <p className="hc-guard-desc">
                  No procedures, conditions, or prescriptions get named in a response &mdash; regardless of what the
                  reviewer themselves disclosed.
                </p>
              </div>
            </div>
            <div className="hc-guard-item">
              <div className="hc-guard-icon"><IconNo /></div>
              <div>
                <div className="hc-guard-title">Reference appointment specifics</div>
                <p className="hc-guard-desc">No dates, times, or which provider someone saw.</p>
              </div>
            </div>
            <div className="hc-guard-item">
              <div className="hc-guard-icon"><IconNo /></div>
              <div>
                <div className="hc-guard-title">Reference billing, payment, or insurance</div>
                <p className="hc-guard-desc">No confirmation of what was charged, paid, or covered.</p>
              </div>
            </div>
            <div className="hc-guard-item">
              <div className="hc-guard-icon"><IconNo /></div>
              <div>
                <div className="hc-guard-title">Dispute the reviewer&apos;s account</div>
                <p className="hc-guard-desc">
                  A public reply can&apos;t verify what happened in a private appointment, so responses acknowledge
                  feedback without contesting the specifics &mdash; which also tends to land better with anyone
                  reading it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hc-band hc-band-wide">
        <div className="hc-band-inner">
          <h2 className="hc-h2">What this looks like on your page</h2>
          <p className="hc-lede">The same review, handled two ways.</p>
          <div className="hc-compare">
            <div className="hc-compare-col">
              <div className="hc-compare-heading risky">A common instinct</div>
              <p className="hc-compare-review">
                &ldquo;Called ahead about my insurance coverage and was told everything was fine, then got a huge
                bill after my visit. Feels like a bait and switch.&rdquo;
              </p>
              <p className="hc-compare-response">
                We&apos;re sorry about the confusion.{" "}
                <span className="hc-flag">Our records show your visit was verified with your insurance provider on
                March 4th</span>, and <span className="hc-flag">the balance reflects your plan&apos;s out-of-pocket
                costs</span> after they processed the claim.
              </p>
              <div className="hc-compare-callouts">
                <div className="hc-compare-callout"><IconNo className="hc-icon-no" size={13} />Confirms a records search and a specific visit date</div>
                <div className="hc-compare-callout"><IconNo className="hc-icon-no" size={13} />Confirms billing and insurance details, publicly</div>
              </div>
            </div>
            <div className="hc-compare-col">
              <div className="hc-compare-heading safe">What RespondPal drafts</div>
              <p className="hc-compare-review">
                &ldquo;Called ahead about my insurance coverage and was told everything was fine, then got a huge
                bill after my visit. Feels like a bait and switch.&rdquo;
              </p>
              <p className="hc-compare-response">
                We&apos;re sorry to hear this, and we understand how frustrating unexpected costs can be. Billing
                questions are always worth a closer look &mdash; please reach out to our office directly so we can
                go through this with you.
              </p>
              <div className="hc-compare-callouts">
                <div className="hc-compare-callout"><IconOk className="hc-icon-ok" />Acknowledges the frustration and invites resolution</div>
                <div className="hc-compare-callout"><IconOk className="hc-icon-ok" />Confirms nothing about the visit, billing, or coverage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hc-band hc-cta-band" id="get-started">
        <div className="hc-band-inner">
          <h2 className="hc-h2">See what this looks like for your practice</h2>
          <p className="hc-lede">
            We&apos;ll pull your practice&apos;s actual Google and Yelp reviews, flag anything that carries privacy
            risk, and show you exactly where you stand &mdash; free, no commitment, and nothing about your patients
            required to do it.
          </p>
          <a className="hc-btn" href="mailto:hello@respondpal.ai?subject=Getting%20started%20with%20RespondPal">
            Get started
          </a>
          <p className="hc-cta-fine">
            Prefer to see the legal analysis first?{" "}
            <a href="mailto:hello@respondpal.ai?subject=HIPAA%20documentation%20request">We&apos;re glad to send it.</a>
          </p>
        </div>
      </section>

      <footer className="hc-band hc-footer">
        <div className="hc-band-inner">
          <span>RespondPal &mdash; review responses built for regulated industries.</span>
          <a href="mailto:hello@respondpal.ai">hello@respondpal.ai</a>
        </div>
      </footer>
    </div>
  );
}
