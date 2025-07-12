"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-wider text-black">
              MUSE
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/protected" className="text-sm font-medium text-gray-700 hover:text-black transition-colors tracking-wide uppercase">
              Artists
            </Link>
            <Link href="#about" className="text-sm font-medium text-gray-700 hover:text-black transition-colors tracking-wide uppercase">
              How it Works
            </Link>
            <Link href="mailto:hello@muse.com" className="bg-black text-white px-6 py-2 text-sm font-medium tracking-wide uppercase hover:bg-gray-800 transition-colors">
              Contact
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link href="/protected" className="bg-black text-white px-4 py-2 text-sm font-medium tracking-wide uppercase">
              Browse
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 