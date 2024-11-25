"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="https://placehold.co/32x32/000080/FFFFFF/png?text=L"
                alt="Lilo Logo"
                width={32}
                height={32}
                className="rounded"
                unoptimized
              />
            </div>
            <span className="text-xl font-bold text-custom-navy">Lilo</span>
          </Link>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-custom-navy transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-custom-navy transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-custom-navy transition-colors">
              Contact
            </Link>
          </div>

          {/* Sign In Button - Right */}
          <div className="flex items-center space-x-4">
            <Link href="http://localhost:3000/sign-in">
              <Button 
                variant="outline"
                className="border-custom-navy text-custom-navy hover:bg-custom-navy hover:text-white transition-colors"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
