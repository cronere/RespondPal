import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'RespondPal — Market Intelligence',
  description: 'Market intelligence and opportunity overview.',
  robots: { index: false, follow: false },
}

export default function Market() {
  return (
    <main className="market-page">
      {/* Nav */}
      <nav className="details-nav">
        <div className="details-nav-inner">
          <Link href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="details-nav-logo" width={180} height={36} />
          </Link>
          <span className="market-nav-tag">Confidential · Market Intelligence</span>
        </div>
      </nav>

      {/* Hero */}
      <header className="market-hero">
        <div className="market-container">
          <div className="market-eyebrow">Sales Rep Education &amp; Market Intelligence</div>
          <h1>Why this service exists.<br />Why it wins. Why you should care.</h1>
          <p className="market-hero-sub">
            Everything you need to understand the opportunity — the data behind the pitch,
            the size of the market, the competition, and what your book of business could look like.
          </p>
        </div>
      </header>

      <div className="market-container market-body">

        {/* What you'll find */}
        <section className="market-toc">
          <div className="market-toc-label">What you&apos;ll find in this document</div>
          <ul>
            <li>Why review responses matter — the data that makes this an easy sell</li>
            <li>Why the market is massive and nearly untapped</li>
            <li>Who the competitors are, and why we beat every one of them</li>
            <li>The exact words that make business owners say yes</li>
            <li>What RespondPal delivers that no one else does at this price</li>
            <li>The size of the opportunity — and what your book of business could look like</li>
          </ul>
        </section>

        {/* SECTION 1 */}
        <SectionLabel n="01" title="Why review responses are non-negotiable" />

        <div className="market-stat-grid">
          <Stat n="89%" label="of consumers expect a response to their review" src="BrightLocal 2026" />
          <Stat n="5%" label="of businesses respond to their reviews consistently" src="BrightLocal / Upfirst 2025" />
          <Stat n="50%" label="of consumers are put off by generic, templated replies" src="BrightLocal 2026" />
          <Stat n="81%" label="expect a response within a week of leaving a review" src="BrightLocal 2026" />
        </div>

        <p className="market-p">
          Here&apos;s the reality you&apos;re selling into: business owners now know reviews matter — most
          will tell you they &ldquo;try to respond.&rdquo; But only about 5% actually keep it up consistently,
          across every review and every platform. The rest fall into three buckets, and <strong>all three
          are your prospect</strong>: the ones who&apos;ve given up and let reviews sit unanswered, the ones
          rushing out generic replies in their spare time (which half of consumers actively distrust), and
          the ones paying $300–800/month for a tool that still makes them do the work. You&apos;re not there
          to convince them reviews matter — they already believe it. You&apos;re there to take it off their plate.
        </p>

        <div className="market-callout">
          <div className="market-callout-label">The AI angle — getting more important, not less</div>
          <p>
            AI search tools like Google&apos;s AI Overviews, ChatGPT, and Perplexity now synthesize reviews
            to decide whether to recommend a business. Response rate, recency, and sentiment all factor in.
            A business that responds inconsistently — or with obvious templates — is sending a weak signal
            to real customers and to AI alike.
          </p>
          <p className="market-pitch">
            Pitch line: &ldquo;Google&apos;s AI is literally reading your review responses now. An unanswered
            review isn&apos;t just a missed conversation — it&apos;s telling AI you&apos;re disengaged.&rdquo;
          </p>
        </div>

        {/* SECTION 2 */}
        <SectionLabel n="02" title="The market opportunity" />

        <p className="market-p">
          The United States has <strong>36.2 million</strong> small businesses (SBA 2025 Small Business
          Profile) — 99.9% of all businesses in America. About <strong>6.3 million</strong> are employer
          firms with staff, revenue, and enough customer volume to care about reviews. That&apos;s the
          realistic addressable market. The best targets — independently owned local service businesses
          with 50+ reviews and little to no response history — number a conservative <strong>2 to 3 million</strong>.
        </p>

        <div className="market-table-wrap">
          <table className="market-table">
            <thead>
              <tr><th>Market</th><th>Businesses</th><th>Revenue Potential</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr><td>TAM — Total Addressable</td><td>6.3M employer SMBs</td><td>$30B+/yr</td><td>All US employer small businesses with Google profiles</td></tr>
              <tr><td>SAM — Serviceable</td><td>~2.5M local service</td><td>$12B+/yr</td><td>Independents with review volume — your real target</td></tr>
              <tr><td>Just 0.5% of market</td><td>~12,500 businesses</td><td>—</td><td>A tiny slice is still a massive book of business</td></tr>
              <tr><td>What one rep can build</td><td>100–300 clients</td><td>—</td><td>A strong closer&apos;s realistic multi-year book</td></tr>
            </tbody>
          </table>
        </div>

        <div className="market-callout market-callout-accent">
          <p>
            The gap in the market: done-for-you review management, any local business, no contract,
            under $400/month. <strong>That gap has 2.5 million businesses sitting in it.</strong>
          </p>
        </div>

        {/* SECTION 3 */}
        <SectionLabel n="03" title="Who we compete with — and why we win" />

        <div className="market-table-wrap">
          <table className="market-table market-table-compact">
            <thead>
              <tr><th>Competitor</th><th>Price/mo</th><th>Contract</th><th>Model</th><th>Yelp?</th><th>Bottom line</th></tr>
            </thead>
            <tbody>
              <tr><td>Birdeye</td><td>$299–499+</td><td>Annual</td><td>DIY Software</td><td>Limited</td><td>Overpriced. Annual lock-in. Business still does the work.</td></tr>
              <tr><td>Podium</td><td>$399–800+</td><td>Annual</td><td>DIY Software</td><td>No</td><td>Expensive. No Yelp. AI replies cost an extra $99/mo.</td></tr>
              <tr><td>Marqii</td><td>Volume-based</td><td>Yes</td><td>Done-for-you</td><td>Yes</td><td>Restaurants only. High volume required.</td></tr>
              <tr><td>RepliFast</td><td>$19–99</td><td>No</td><td>AI Software</td><td>No</td><td>Cheapest. Business still approves every post. No real service.</td></tr>
              <tr><td>BrightLocal</td><td>$7–70</td><td>No</td><td>Monitoring</td><td>No</td><td>Doesn&apos;t respond at all. Just tells you reviews exist.</td></tr>
              <tr className="market-row-highlight"><td>RespondPal</td><td>$397–897</td><td>None</td><td>Done-for-you</td><td>Yes</td><td>The ONLY done-for-you service for ANY local business at this price.</td></tr>
            </tbody>
          </table>
        </div>

        <div className="market-two-col">
          <div className="market-objection">
            <div className="market-objection-q">&ldquo;I already use Birdeye or Podium&rdquo;</div>
            <p>Those are great tools if you have a marketing team logging in every day. Most owners pay
            $400–600/month and never use them consistently. We actually do it for you — no logging in,
            no approvals, no thinking about it. Same price, zero effort.</p>
          </div>
          <div className="market-objection">
            <div className="market-objection-q">&ldquo;I use RepliFast for $39/month&rdquo;</div>
            <p>RepliFast generates AI drafts you still have to approve and post every day. Are you actually
            logging in every morning to do that? We handle every single response for you — you never touch it.</p>
          </div>
        </div>

        {/* SECTION 4 */}
        <SectionLabel n="04" title="What we deliver & how to sell it" />

        <p className="market-p">For $397/month, a local business gets:</p>

        <div className="market-deliver-grid">
          {[
            'Every review responded to within 24 hours',
            'Google Business Profile covered',
            'Human-reviewed responses — never templates',
            'Yelp Business covered',
            'All star ratings handled (1–5 stars)',
            'On-brand voice for their specific business',
            'Negative reviews handled professionally',
            'No passwords shared — official manager access',
            'Client dashboard to see all responses',
            'Cancel anytime — no contract, no penalty',
            'Profile Cleanup add-on available',
            'Setup in under 10 minutes, live in 48 hours',
          ].map((item, i) => (
            <div key={i} className="market-deliver-item">
              <span className="market-check">✓</span> {item}
            </div>
          ))}
        </div>

        <div className="market-callout">
          <div className="market-callout-label">The pricing conversation</div>
          <p className="market-objection-q" style={{ marginTop: '0.5rem' }}>HVAC company ($3,000–15,000/job)</p>
          <p>&ldquo;$397 a month is less than what you make on one service call. If responding to your
          reviews brings in even one new customer this month — which the data says it will — you&apos;ve
          paid for a full year. Everything after that is profit.&rdquo;</p>
          <p className="market-objection-q">Dental office ($500 average patient value)</p>
          <p>&ldquo;One new patient from Google this month covers 9 months of RespondPal. You&apos;re already
          spending money on your Google profile just by existing on it. We&apos;re making sure it works for you.&rdquo;</p>
          <p className="market-objection-q">Med spa ($300–600 per treatment)</p>
          <p>&ldquo;Your clients read reviews before booking. A profile that responds professionally to every
          review — including the negative ones — converts browsers into booked appointments.&rdquo;</p>
        </div>

        {/* SECTION 5 */}
        <SectionLabel n="05" title="The opportunity for you" />

        <p className="market-p">
          To make a great living, you don&apos;t need millions of clients. You need a few hundred. Because
          you earn residuals on every active client, your income compounds. Here&apos;s what a book of
          business looks like at one location per client:
        </p>

        <div className="market-table-wrap">
          <table className="market-table">
            <thead>
              <tr><th>Your Book</th><th>Upfront (per close)</th><th>Monthly Residual</th><th>Annual Residual</th></tr>
            </thead>
            <tbody>
              <tr><td>25 clients</td><td>$200 each</td><td>~$2,500/mo</td><td>~$30,000/yr</td></tr>
              <tr><td>50 clients</td><td>$200 each</td><td>~$5,000/mo</td><td>~$60,000/yr</td></tr>
              <tr><td>100 clients</td><td>$200 each</td><td>~$10,000/mo</td><td>~$120,000/yr</td></tr>
              <tr className="market-row-highlight"><td>200 clients</td><td>$200 each</td><td>~$20,000/mo</td><td>~$240,000/yr</td></tr>
            </tbody>
          </table>
        </div>
        <p className="market-fineprint">
          Residual figures show the blended monthly residual once your book is established (months 2–12
          pay $100/location, month 13+ pays $50/location). The upfront $200 per location is on top of this,
          every time you close.
        </p>

        <div className="market-two-col">
          <div className="market-why-col">
            <div className="market-why-label">The product makes selling easy</div>
            <ul>
              <li>Nearly every business you call qualifies — only ~5% respond consistently</li>
              <li>The problem is visible — you can see unanswered reviews before you call</li>
              <li>One-call close — not a complex enterprise sale</li>
              <li>No contract removes the biggest objection before they raise it</li>
              <li>Low price point — easy yes for any business owner</li>
            </ul>
          </div>
          <div className="market-why-col">
            <div className="market-why-label">The comp makes it worth your time</div>
            <ul>
              <li>$200 per location upfront — paid within 7 days</li>
              <li>Residual income on every client, every month they stay</li>
              <li>No clawbacks — you keep what you earn</li>
              <li>Your residuals continue even if you move on</li>
              <li>No cap — limited only by how much you close</li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="market-bottomline">
          <div className="market-bottomline-label">The bottom line</div>
          <p>
            A massive, underserved market. A product that sells itself. A comp plan that pays you for years
            on every client you close. If you&apos;re a hungry closer who knows how to talk to local business
            owners, there&apos;s no ceiling on what you can build here. The only question is how many calls
            you&apos;re willing to make.
          </p>
        </div>

        <footer className="market-footer">
          <p>RespondPal LLC · respondpal.ai · jacob@respondpal.ai</p>
          <p className="market-confidential">Confidential — for prospective sales partners only.</p>
        </footer>
      </div>
    </main>
  )
}

function SectionLabel({ n, title }) {
  return (
    <div className="market-section-label">
      <span className="market-section-n">{n}</span>
      <span className="market-section-title">{title}</span>
    </div>
  )
}

function Stat({ n, label, src }) {
  return (
    <div className="market-stat">
      <div className="market-stat-n">{n}</div>
      <div className="market-stat-label">{label}</div>
      <div className="market-stat-src">{src}</div>
    </div>
  )
}
