import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'How RespondPal Works — Review Management, Done For You',
  description:
    'AI-drafted, human-approved review responses for every Google and Yelp review. Industry-calibrated. 24-hour guarantee. $397/month, no contracts.',
}

export default function Details() {
  return (
    <main className="details-page">
      {/* Nav — matches main site */}
      <nav className="details-nav">
        <div className="details-nav-inner">
          <Link href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="details-nav-logo" width={180} height={36} />
          </Link>
          <a href="mailto:team@respondpal.ai" className="details-nav-cta">Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="details-hero">
        <div className="details-container">
          <div className="details-hero-eyebrow">Done-for-you review management</div>
          <h1 className="details-hero-title">
            Every review.<br />
            <em>Google &amp; Yelp.</em><br />
            You do nothing.
          </h1>
          <p className="details-hero-sub">
            We respond to every Google and Yelp review your business receives —
            using proprietary, industry-calibrated AI with human approval on every response —
            within 24 hours, every time.
          </p>
        </div>
      </section>

      <div className="details-container">
        {/* The Problem */}
        <section className="details-section">
          <div className="details-label">The Problem</div>
          <p className="details-lead">
            Most business owners respond to at least some reviews — but most responses
            are hurting them. Templated replies that ignore the complaint. Defensive
            rebuttals that make the business look combative. Generic copy-paste that
            signals to customers (and now to AI search tools like Google&apos;s AI
            Overviews) that nobody is actually paying attention. The problem isn&apos;t
            silence anymore — it&apos;s quality.
          </p>
          <div className="details-stats">
            <div className="details-stat">
              <div className="details-stat-num">89%</div>
              <div className="details-stat-desc">of consumers expect a response to their reviews</div>
            </div>
            <div className="details-stat">
              <div className="details-stat-num">5%</div>
              <div className="details-stat-desc">of businesses respond to reviews consistently</div>
            </div>
            <div className="details-stat">
              <div className="details-stat-num">50%</div>
              <div className="details-stat-desc">are put off by generic, templated replies</div>
            </div>
            <div className="details-stat">
              <div className="details-stat-num">81%</div>
              <div className="details-stat-desc">expect a response within a week</div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="details-section">
          <div className="details-label">What We Do</div>
          <div className="details-pitch">
            <div className="details-pitch-label">The short version</div>
            <p>
              &ldquo;We respond to every Google and Yelp review your business
              receives — within 24 hours, every time. Our proprietary AI crafts
              each response on-brand and calibrated for your industry. A human
              reviews every response before it goes live. You never have to
              think about it again.&rdquo;
            </p>
          </div>
          <p className="details-body">
            No templates, no generic chatbot. Our AI has been engineered on
            thousands of real business reviews across dental, legal, veterinary,
            auto repair, the trades, restaurants, and more — studying what works
            and what backfires. Each response is written for your business, your
            reviewer, and your brand voice. And it gets smarter for your business
            each month.
          </p>

          {/* Examples */}
          <div className="details-examples">
            <div className="details-review">
              <div className="details-review-head">
                <span className="details-stars">★★★★★</span>
                <span className="details-reviewer">Sarah R. · Google</span>
              </div>
              <p className="details-review-text">
                &ldquo;Best service I&apos;ve had in years. Will definitely be
                back!&rdquo;
              </p>
              <div className="details-response">
                <div className="details-response-label">Owner response · within 24 hrs</div>
                <p>
                  Thank you so much, Sarah — this genuinely made our day!
                  We&apos;ll pass along the kind words to the team. Can&apos;t
                  wait to see you again soon.
                </p>
              </div>
            </div>
            <div className="details-review">
              <div className="details-review-head">
                <span className="details-stars low">★★☆☆☆</span>
                <span className="details-reviewer">Tom K. · Yelp</span>
              </div>
              <p className="details-review-text">
                &ldquo;Service was slow and nobody checked in on us.&rdquo;
              </p>
              <div className="details-response">
                <div className="details-response-label">Owner response · within 24 hrs</div>
                <p>
                  Tom, thank you for being honest — we&apos;re sorry we let you
                  down. Please reach out directly and we&apos;ll make it right on
                  your next visit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="details-section">
          <div className="details-label">How It Works — Live in 48 Hours</div>
          <div className="details-steps">
            <div className="details-step">
              <div className="details-step-num">01</div>
              <h3>You sign up</h3>
              <p>Takes 5 minutes. You add us as a manager on Google and a team member on Yelp. We walk you through both, step by step.</p>
            </div>
            <div className="details-step">
              <div className="details-step-num">02</div>
              <h3>We get to work</h3>
              <p>Every review that comes in — 5-star praise, 1-star complaint, no text — gets a professional response from our team.</p>
            </div>
            <div className="details-step">
              <div className="details-step-num">03</div>
              <h3>Responses go live</h3>
              <p>Within 24 hours of each review posting, a response publishes under your business. On-brand, on-time, every time.</p>
            </div>
            <div className="details-step">
              <div className="details-step-num">04</div>
              <h3>You stay in the loop</h3>
              <p>Every response is public on your Google and Yelp profiles, so you can see our work anytime — and request a change on any response whenever you&apos;d like.</p>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="details-section">
          <div className="details-label">What&apos;s Included in Every Plan</div>
          <div className="details-included">
            <ul>
              <li>Google <strong>and</strong> Yelp review responses</li>
              <li>Unlimited reviews covered</li>
              <li>24-hour response guarantee</li>
              <li>Industry-calibrated AI drafting</li>
              <li>Human-approved — every response reviewed before posting</li>
            </ul>
            <ul>
              <li>Gets smarter for your business each month</li>
              <li>Quarterly Reputation &amp; Business Intelligence Report</li>
              <li>Request changes anytime</li>
              <li>Secure manager access — no passwords shared</li>
              <li>Cancel anytime, no penalty</li>
            </ul>
          </div>
        </section>

        {/* Quarterly Intelligence Report */}
        <section className="details-section">
          <div className="details-label">Beyond Responses — The Quarterly Intelligence Report</div>
          <div className="details-cleanup">
            <p>
              Every quarter, we send you a Reputation &amp; Business Intelligence
              Report — a clear, readable summary of what we handled, how your
              rating is trending, and what your customers are actually telling
              you. We read every review, not just to respond, but to surface
              what&apos;s working and what deserves your attention — the
              employee getting called out by name, the pattern worth a closer
              look. It&apos;s the part of your reviews most owners never have
              time to see.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="details-section">
          <div className="details-label">Pricing — Flat Monthly Rate, No Contracts</div>
          <div className="details-pricing">
            <div className="details-price">
              <div className="details-price-name">1 Location</div>
              <div className="details-price-amount">$397</div>
              <div className="details-price-period">per month</div>
            </div>
            <div className="details-price">
              <div className="details-price-name">2 Locations</div>
              <div className="details-price-amount">$649</div>
              <div className="details-price-period">per month · save $145</div>
            </div>
            <div className="details-price">
              <div className="details-price-name">3 Locations</div>
              <div className="details-price-amount">$897</div>
              <div className="details-price-period">per month · save $294</div>
            </div>
            <div className="details-price details-price-custom">
              <div className="details-price-name">4+ Locations / Enterprise</div>
              <div className="details-price-amount sm">Custom</div>
              <div className="details-price-period">high-volume accounts welcome — contact us for a rate</div>
            </div>
          </div>
          <p className="details-price-note">
            No setup fees. No long-term contracts. Billed monthly in advance —
            cancel anytime and you won&apos;t be charged again.
          </p>
        </section>

        {/* Reputation Risk Audit & Cleanup */}
        <section className="details-section">
          <div className="details-label">Optional Add-On — Reputation Risk Audit &amp; Cleanup ($297 one-time)</div>
          <div className="details-cleanup">
            <p>
              Most businesses have two problems on their profile right now: reviews
              that were never answered, and responses that were answered badly.
              Our one-time Risk Audit &amp; Cleanup does both. We scan every existing
              response on your profile for red flags — privacy slip-ups, combative
              replies, generic templates — and rewrite what needs fixing. We also
              respond to every unanswered 1–3 star review from the last 180 days.
              Completed within 5 business days. Most clients add this at signup.
            </p>
          </div>
        </section>

        {/* Why It Matters */}
        <section className="details-section">
          <div className="details-label">Why This Matters More Than Ever</div>
          <p className="details-body">
            Bad review responses are more visible — and more damaging — than ever.
            A combative rebuttal, a tone-deaf template, or a privacy slip-up lives
            on your profile permanently. And AI search tools like Google&apos;s AI
            Overviews, ChatGPT, and Perplexity now synthesize your reviews and
            responses to decide whether to recommend your business. Response
            quality, not just response rate, affects how AI characterizes you.
            A professional, on-brand response to a tough review doesn&apos;t just
            reassure future customers — it shapes how AI represents your business
            to thousands of people who will never scroll your reviews themselves.
          </p>
        </section>

        {/* How Access Works */}
        <section className="details-section">
          <div className="details-label">How Access Works — Your Account Stays Yours</div>
          <div className="details-access">
            <div className="details-access-col">
              <h3>Google Business Profile</h3>
              <p>
                We get added as a <strong>Manager</strong> using Google&apos;s
                standard team access feature. You remain the Owner. Takes about 2
                minutes to set up. Remove our access instantly if you ever
                cancel.
              </p>
            </div>
            <div className="details-access-col">
              <h3>Yelp Business</h3>
              <p>
                We get added as a <strong>Team Member</strong> via Yelp&apos;s
                standard business settings. No passwords shared on either
                platform. You stay in complete control of your profiles at all
                times.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="details-cta">
          <h2>Ready to get started?</h2>
          <p>Setup takes less than 10 minutes. Live within 48 hours. No contract.</p>
          <div className="details-cta-buttons">
            <a href="mailto:team@respondpal.ai" className="details-btn-primary">
              Get started today
            </a>
            <Link href="/" className="details-btn-outline">
              Learn more
            </Link>
          </div>
          <p className="details-cta-contact">
            respondpal.ai · team@respondpal.ai
          </p>
        </section>

        {/* Footer */}
        <footer className="details-footer">
          <p>RespondPal LLC · respondpal.ai</p>
          <div className="details-footer-links">
            <Link href="/terms">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <p className="details-sources">
            Sources: BrightLocal Local Consumer Review Survey (2026) ·
            business response-rate data via BrightLocal &amp; Upfirst (2025)
          </p>
        </footer>
      </div>
    </main>
  )
}
