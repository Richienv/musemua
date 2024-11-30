import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { Toaster } from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import { Inter, Playfair_Display } from 'next/font/google'

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
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${playfair.variable} overflow-x-hidden`}>
      <body className={`${GeistSans.className} overflow-x-hidden`}>
        <Toaster position="top-center" />
        <main className="min-h-screen flex flex-col items-center w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
