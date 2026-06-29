import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — RespondPal',
  description: 'RespondPal Privacy Policy.',
}

export default function Privacy() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">← Back to RespondPal</Link>

        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: July 2026</p>

        <p className="legal-intro">
          This Privacy Policy explains how RespondPal LLC (&ldquo;RespondPal,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and
          protects information when you visit our website or use our review
          response management service.
        </p>

        <section className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="legal-list">
            <li>
              <strong>Information you provide.</strong> Your name, business name,
              email address, phone number, industry, number of locations, brand
              voice preferences, and any other details you submit through our
              contact or onboarding forms.
            </li>
            <li>
              <strong>Account access information.</strong> When you connect your
              Google Business Profile and Yelp Business account, we receive
              access to view and respond to reviews. We do not collect or store
              your account passwords.
            </li>
            <li>
              <strong>Payment information.</strong> Payments are processed by
              Stripe. We do not store your full card details; Stripe handles
              that information under its own security and privacy standards.
            </li>
            <li>
              <strong>Usage information.</strong> Basic technical data such as
              your IP address, browser type, and pages visited, collected
              through standard web analytics when you use our website.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="legal-list">
            <li>Provide, operate, and maintain the review response service;</li>
            <li>Publish responses to reviews on your connected profiles;</li>
            <li>Communicate with you about your account, including service updates and support;</li>
            <li>Process payments and manage your subscription;</li>
            <li>Improve our website and service.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Share Information</h2>
          <p>
            We do not sell your personal information. We share information only
            in these limited circumstances:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Service providers.</strong> With trusted vendors who help
              us operate, such as Stripe (payments), our email and hosting
              providers, and the Google and Yelp platforms (to publish responses
              on your behalf).
            </li>
            <li>
              <strong>Legal requirements.</strong> When required by law, court
              order, or to protect our rights, safety, or property.
            </li>
            <li>
              <strong>Business transfers.</strong> In connection with a merger,
              acquisition, or sale of assets, in which case we will notify you.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Google &amp; Yelp Data</h2>
          <p>
            Our service operates by accessing your Google Business Profile and
            Yelp Business account with your permission. We use this access
            solely to read reviews and publish responses on your behalf. We do
            not use your review data for any purpose other than providing the
            service to you, and we comply with the applicable platform policies
            governing that access.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active and
            for a reasonable period afterward to comply with legal obligations,
            resolve disputes, and enforce our agreements. You may request
            deletion of your information at any time, subject to those
            obligations.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Data Security</h2>
          <p>
            We take reasonable measures to protect your information, including
            limiting access to authorized personnel and relying on reputable
            third-party providers with their own security standards. No method
            of transmission or storage is completely secure, however, and we
            cannot guarantee absolute security.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Your Rights</h2>
          <p>
            Depending on your location, you may have the right to access,
            correct, or delete the personal information we hold about you, or to
            object to certain processing. To exercise any of these rights,
            contact us at the email below.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Cookies &amp; Analytics</h2>
          <p>
            Our website may use cookies and similar technologies to understand
            how visitors use the site and to improve it. You can control cookies
            through your browser settings.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Children&rsquo;s Privacy</h2>
          <p>
            Our service is intended for businesses and is not directed to
            individuals under 18. We do not knowingly collect information from
            children.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes
            will be reflected by the &ldquo;Last updated&rdquo; date above and,
            where appropriate, communicated to active clients by email.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact</h2>
          <p>
            Questions about this Privacy Policy or your information? Contact us
            at <a href="mailto:jacob@respondpal.ai">jacob@respondpal.ai</a>.
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
