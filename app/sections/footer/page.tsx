"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-[1200px] mx-auto">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold tracking-wider text-black mb-4">MUSE</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Connecting exceptional makeup artists with visionary creators for unparalleled collaborative excellence.
                </p>
              </div>
            </div>

            {/* Services Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-black mb-4 tracking-wide uppercase">Services</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 hover:text-black transition-colors cursor-pointer">Editorial Makeup</p>
                  <p className="text-sm text-gray-600 hover:text-black transition-colors cursor-pointer">Brand Campaigns</p>
                  <p className="text-sm text-gray-600 hover:text-black transition-colors cursor-pointer">Fashion Photography</p>
                  <p className="text-sm text-gray-600 hover:text-black transition-colors cursor-pointer">Special Events</p>
                </div>
              </div>
            </div>

            {/* Contact Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-black mb-4 tracking-wide uppercase">Contact</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <a href="mailto:hello@muse.com" className="hover:text-black transition-colors">
                      hello@muse.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-600">
                    <a href="mailto:partnerships@muse.com" className="hover:text-black transition-colors">
                      partnerships@muse.com
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-black mb-4 tracking-wide uppercase">Follow</h4>
                <div className="flex space-x-6">
                  <a href="#" className="text-gray-600 hover:text-black transition-colors text-sm">Instagram</a>
                  <a href="#" className="text-gray-600 hover:text-black transition-colors text-sm">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 mt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <span className="text-sm text-gray-600">
                  © 2024 MUSE. All rights reserved.
                </span>
                <Link href="/privacy-notice" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Global Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 