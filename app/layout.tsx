import { Inter, Playfair_Display } from 'next/font/google'
import { GeistSans } from 'geist/font'
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { Toaster } from "@/components/ui/toaster";
import "react-datepicker/dist/react-datepicker.css";
import { CSSProperties } from 'react';

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair'
})

const defaultUrl = process.env.VERCEL_URL 
  ? `https://liloapp.vercel.app`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Salda by TROLIVE - Platform Live Selling Shopee & TikTok Terbaik di Indonesia",
  description: "Platform live selling terbaik dari TROLIVE yang menghubungkan UMKM dengan live streamer profesional untuk Shopee dan TikTok Live. Tingkatkan penjualan online Anda dengan host live streaming berpengalaman.",
  keywords: "salda, trolive, live selling, live streaming, shopee live, tiktok live, host live streaming, jasa live streaming, live commerce indonesia, live seller, live shopping, penyedia jasa live streaming, livestreaming marketplace, umkm digital, platform live selling terbaik, jasa live selling terpercaya, host tiktok shop, host shopee live",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://salda.id",
  },
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.ico',
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  openGraph: {
    type: 'website',
    title: 'Salda by TROLIVE - Platform Live Selling Shopee & TikTok Terbaik di Indonesia',
    description: 'Platform live selling terbaik dari TROLIVE yang menghubungkan UMKM dengan live streamer profesional untuk Shopee dan TikTok Live. Tingkatkan penjualan online Anda dengan host live streaming berpengalaman.',
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://salda.id",
    siteName: 'Salda by TROLIVE',
    locale: 'id_ID',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Salda by TROLIVE - Platform Live Selling Terbaik',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salda by TROLIVE - Platform Live Selling Shopee & TikTok Terbaik di Indonesia',
    description: 'Platform live selling terbaik dari TROLIVE yang menghubungkan UMKM dengan live streamer profesional untuk Shopee dan TikTok Live. Tingkatkan penjualan online Anda dengan host live streaming berpengalaman.',
    images: ['/android-chrome-512x512.png'],
    site: '@salda_id',
  },
  verification: {
    google: 'notranslate',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

interface CustomCSSProperties extends CSSProperties {
  '--primary-gradient': string;
  '--primary-gradient-hover': string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${playfair.variable}`}>
      <body 
        className={`${GeistSans.className} bg-[#faf9f6]`}
        style={{
          '--primary-gradient': 'linear-gradient(to right, #2563eb, #7c3aed)',
          '--primary-gradient-hover': 'linear-gradient(to right, #1d4ed8, #6d28d9)'
        } as CustomCSSProperties}
      >
        <Toaster />
        <main className="min-h-screen w-full bg-[#faf9f6]">
          {children}
        </main>
      </body>
    </html>
  );
}
