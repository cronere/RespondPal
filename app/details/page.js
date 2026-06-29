import Link from 'next/link'

export const metadata = {
  title: 'How RespondPal Works — Review Management, Done For You',
  description:
    'We respond to every Google and Yelp review your business receives within 24 hours. Professional, human-reviewed responses. $397/month, no contracts.',
}

export default function Details() {
  return (
    <main className="details-page">
      {/* Header */}
      <header className="details-header">
        <div className="details-container">
          <div className="details-logo">
            Respond<span>Pal</span>
          </div>
          <p className="details-tagline">
            Google &amp; Yelp Review Response Management — Done For You
          </p>
        </div>
      </header>

      <div className="details-container">
        {/* The Problem */}
        <section className="details-section">
          <div className="details-label">The Problem</div>
          <p className="details-lead">
            95% of local businesses never respond to their Google and Yelp
            reviews. Every unanswered review is a signal to potential customers —
            and now to AI search tools like Google&apos;s AI Overviews — that
            your business doesn&apos;t engage. That costs you customers.
          </p>
          <div className="details-stats">
            <div className="details-stat">
              <div className="details-stat-num">89%</div>
              <div className="details-stat-desc">of consumers expect a response to their review</div>
            </div>
            <div className="details-stat">
              <div className="details-stat-num">95%</div>
              <div className="details-stat-desc">of businesses never respond to reviews</div>
            </div>
            <div className="details-stat">
              <div className="details-stat-num">2.7 days</div>
              <div className="details-stat-desc">average time a business takes to respond</div>
            </div>
            <div className="details-stat">
              <div className="details-stat-num">18%</div>
              <div className="details-stat-desc">more revenue from responding to all reviews</div>
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
              receives — within 24 hours, every time. Professional, on-brand
              responses posted directly from your profile. You never have to
              think about it again.&rdquo;
            </p>
          </div>
          <p className="details-body">
            Every response is human-reviewed before it goes live. No templates,
            no copy-paste. Each response is written for your business, your
            reviewer, and your brand voice.
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
              <p>Log into your dashboard anytime to see every review and every response. Full visibility, zero effort.</p>
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
              <li>Human-reviewed, never templated</li>
            </ul>
            <ul>
              <li>All star ratings — 1 through 5 stars</li>
              <li>Client dashboard access</li>
              <li>Secure manager access — no passwords shared</li>
              <li>Cancel anytime, no penalty</li>
            </ul>
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
              <div className="details-price-name">4+ Locations</div>
              <div className="details-price-amount sm">Custom</div>
              <div className="details-price-period">contact us for a rate</div>
            </div>
          </div>
          <p className="details-price-note">
            No setup fees. No long-term contracts. Billed monthly in advance —
            cancel anytime and you won&apos;t be charged again.
          </p>
        </section>

        {/* Profile Cleanup */}
        <section className="details-section">
          <div className="details-label">Optional Add-On — Profile Cleanup ($197 one-time)</div>
          <div className="details-cleanup">
            <p>
              Most businesses have months of unanswered negative reviews sitting
              on their profile right now. Our one-time Profile Cleanup responds
              to every 1–3 star review from the last 180 days — so your profile
              looks professionally managed from day one, not just going forward.
              Completed within 5 business days. Most clients add this at signup.
            </p>
          </div>
        </section>

        {/* Why It Matters */}
        <section className="details-section">
          <div className="details-label">Why This Matters More Than Ever</div>
          <p className="details-body">
            AI search tools like Google&apos;s AI Overviews, ChatGPT, and
            Perplexity now synthesize your reviews to decide whether to recommend
            your business. Response rate, recency, and sentiment all factor in.
            An unanswered review isn&apos;t just a missed conversation — it&apos;s
            a negative signal to AI that your business is disengaged. Businesses
            that respond consistently rank higher and get recommended more.
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
            <a href="mailto:jacob@respondpal.ai" className="details-btn-primary">
              Get started today
            </a>
            <Link href="/" className="details-btn-outline">
              Learn more
            </Link>
          </div>
          <p className="details-cta-contact">
            respondpal.ai · jacob@respondpal.ai
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
            Sources: BrightLocal Local Consumer Review Survey (2024) · Harvard
            Business Review (2022) · ReplyOnTheFly Benchmark Report (2023)
          </p>
        </footer>
      </div>
    </main>
  )
}
