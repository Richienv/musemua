import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { Toaster } from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import { Inter, Playfair_Display } from 'next/font/google'
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
  title: "Salda",
  description: "Temukan streamer terbaik untuk kebutuhan live-selling streaming Anda",
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
        className={`${GeistSans.className} bg-white overflow-x-hidden`} 
        style={{
          '--primary-gradient': 'linear-gradient(to right, #2563eb, #7c3aed)',
          '--primary-gradient-hover': 'linear-gradient(to right, #1d4ed8, #6d28d9)'
        } as CustomCSSProperties}
      >
        <Toaster position="top-center" />
        <main className="min-h-screen flex flex-col items-center w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
