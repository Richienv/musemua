import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  metadataBase: new URL('https://salda.id'),
  title: {
    default: 'Salda - Platform Live Streaming Bersama Host Profesional',
    template: '%s | Salda'
  },
  description: 'Platform yang membantu UMKM meningkatkan penjualan melalui live streaming bersama host profesional.',
  keywords: ['live streaming', 'host profesional', 'UMKM', 'penjualan online', 'live commerce'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://salda.id',
    siteName: 'Salda',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Salda - Platform Live Streaming',
      }
    ],
  },
  icons: {
    icon: '/icon-salda.png',
    shortcut: '/icon-salda.png',
    apple: '/apple-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-icon-precomposed.png',
    },
  },
  twitter: {
    card: 'summary_large_image',
    site: '@salda_id',
    creator: '@salda_id',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://salda.id',
    languages: {
      'id-ID': 'https://salda.id',
      'en-US': 'https://salda.id/en',
    },
  },
} 