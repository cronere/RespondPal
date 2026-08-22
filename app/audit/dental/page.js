import IndustryAuditLanding from '../_components/IndustryAuditLanding'

export const metadata = {
  title: 'Free HIPAA Risk Audit for Dental Practices — RespondPal',
  description:
    'We scan every response on your dental practice\'s Google and Yelp profile for HIPAA privacy violations, combative replies, and tone-deaf templates. Custom report delivered in 48 hours.',
}

export default function DentalAuditLanding() {
  return (
    <IndustryAuditLanding
      headlineLine1="Is Your Dental Practice"
      headlineLine2="Accidentally Violating HIPAA?"
      badExample={{
        label: 'Privacy violation',
        text: (
          <>
            A dental practice publicly stated &ldquo;we have not seen you since 2021&rdquo; —
            confirming the reviewer&apos;s patient status and visit history on a public forum.
          </>
        ),
        verdict: 'This is a HIPAA-adjacent liability sitting on a live Google profile right now.',
      }}
    />
  )
}
