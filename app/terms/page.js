import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — RespondPal',
  description: 'RespondPal Terms of Service.',
}

export default function Terms() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">← Back to RespondPal</Link>

        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-updated">Last updated: July 2026</p>

        <p className="legal-intro">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the review
          response management services provided by RespondPal LLC
          (&ldquo;RespondPal,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
          By signing up for or using our service, you agree to these Terms.
        </p>

        <section className="legal-section">
          <h2>1. The Service</h2>
          <p>
            RespondPal provides done-for-you review response management. We
            monitor your connected Google Business Profile and Yelp Business
            accounts and publish professional, on-brand responses to customer
            reviews on your behalf, typically within 24 hours of a review
            posting. Specific deliverables depend on the plan you select.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Account Access &amp; Your Responsibilities</h2>
          <p>
            To provide the service, you grant us manager or team-member access
            to your Google Business Profile and/or Yelp Business account. You
            represent that you are authorized to grant this access. You remain
            the owner of your accounts at all times and may revoke our access
            whenever you choose.
          </p>
          <p>
            You are responsible for providing accurate business information and
            for the accuracy of the brand-voice preferences you submit during
            onboarding. You agree not to use the service for any unlawful
            purpose or to direct us to publish false, misleading, defamatory, or
            otherwise unlawful content.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Billing &amp; Payment</h2>
          <p>
            <strong>RespondPal is billed monthly, in advance.</strong> Your
            subscription begins on the date of your first payment and renews
            automatically each month on that same date until cancelled. Your
            plan rate is determined by the number of locations under management.
          </p>
          <p>
            Payments are processed securely through Stripe. By subscribing, you
            authorize us to charge your payment method automatically each
            billing period until you cancel.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Cancellation &amp; Refunds</h2>
          <p>
            <strong>You may cancel at any time — there is no contract and no
            cancellation fee.</strong> To cancel, simply notify us or remove our
            access to your accounts.
          </p>
          <p>
            Because the service is billed monthly in advance, cancellation stops
            all future billing but does not refund or prorate the current
            billing period. When you cancel, your service continues through the
            end of the month you have already paid for, and you will not be
            charged again. We do not issue refunds for partial months or for the
            current paid period.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Profile Cleanup Add-On</h2>
          <p>
            The optional Profile Cleanup add-on is a one-time service in which we
            respond to your existing backlog of past reviews. It is billed once,
            is non-recurring, and is non-refundable once the work has begun.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Service Standards</h2>
          <p>
            We strive to respond to every eligible review within 24 hours of it
            posting. Our ability to do so depends on continued, valid access to
            your accounts and on the availability of the underlying Google and
            Yelp platforms. We are not responsible for delays or interruptions
            caused by platform outages, changes to third-party APIs or policies,
            or revocation of our access.
          </p>
          <p>
            All responses are reviewed by a human before publishing. If you are
            ever unhappy with a response, let us know and we will revise it.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Intellectual Property</h2>
          <p>
            Responses we publish on your behalf become part of your business
            profiles and belong to you. The RespondPal name, brand, website,
            software, and internal processes remain our property. Nothing in
            these Terms transfers ownership of our intellectual property to you.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            The service is provided &ldquo;as is.&rdquo; We do not guarantee any
            specific outcome, including improvements in ratings, rankings,
            search visibility, or revenue. To the maximum extent permitted by
            law, RespondPal&rsquo;s total liability arising out of or relating to
            the service is limited to the amount you paid us in the three (3)
            months preceding the event giving rise to the claim. We are not
            liable for indirect, incidental, special, or consequential damages.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material
            changes, we will notify active clients by email. Your continued use
            of the service after changes take effect constitutes acceptance of
            the updated Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Arizona, without
            regard to its conflict-of-law principles.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact</h2>
          <p>
            Questions about these Terms? Reach us at{' '}
            <a href="mailto:jacob@respondpal.ai">jacob@respondpal.ai</a>.
          </p>
        </section>

        <div className="legal-footer">
          <p>RespondPal LLC · respondpal.ai</p>
          <div className="legal-links">
            <Link href="/terms">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
