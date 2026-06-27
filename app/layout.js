import { Inter, Barlow_Condensed } from 'next/font/google'
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
  title: 'RespondPal — Google & Yelp Review Responses, Done For You',
  description:
    'We respond to every Google and Yelp review your business receives within 24 hours. Done-for-you review management for $397/month. No contracts.',
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
    title: 'RespondPal — Google & Yelp Review Responses, Done For You',
    description:
      '95% of businesses never respond to reviews. We handle every Google and Yelp review within 24 hours — $397/month, no contracts.',
    url: 'https://respondpal.ai',
    siteName: 'RespondPal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RespondPal — Google & Yelp Review Responses, Done For You',
    description: '95% of businesses never respond to reviews. We handle every review within 24 hours so you don\'t have to.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  )
}
