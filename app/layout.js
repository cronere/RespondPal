import { Inter, Barlow_Condensed } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata = {
  title: 'RespondPal — AI-Drafted, Human-Approved Review Responses',
  description:
    'AI-drafted, human-approved responses to every Google and Yelp review — calibrated for your industry, posted within 24 hours. $397/month, no contracts.',
  metadataBase: new URL('https://respondpal.ai'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'RespondPal — AI-Drafted, Human-Approved Review Responses',
    description:
      'Industry-calibrated AI crafts on-brand responses to every Google and Yelp review. A human approves every one. $397/month, no contracts.',
    url: 'https://respondpal.ai',
    siteName: 'RespondPal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RespondPal — AI-Drafted, Human-Approved Review Responses',
    description: 'Industry-calibrated AI + human approval on every review response. Faster, better, and cheaper than doing it yourself. $397/month.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2099232417336489');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2099232417336489&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        {children}
      </body>
    </html>
  )
}
