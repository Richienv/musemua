"use client";

import Link from "next/link";
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, LogOut, Menu, X } from "lucide-react";
import { createClient } from '@/utils/supabase/client';

interface NavbarProps {
  onFilterChange?: (value: string) => void;
}

export function Navbar({ onFilterChange }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingUser(true);
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      setUser(user);
      setIsLoadingUser(false);
    };

    fetchUserData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onFilterChange?.(value);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const isProtectedPage = pathname === '/protected';

  return (
    <div className="w-full bg-white border-b border-black/10 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Navigation */}
        <div className="flex items-center justify-between h-24">
          {/* Left - Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/protected" 
              className="editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
            >
              Explore
            </Link>
            <Link 
              href="/about" 
              className="editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
            >
              About
            </Link>
          </div>

          {/* Center - Editorial Masthead */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="group">
              <div className="text-center">
                <h1 className="editorial-title text-black group-hover:text-vogue-gold transition-colors duration-500">
                  MUSE
                </h1>
                <div className="w-16 h-px bg-black group-hover:bg-vogue-gold transition-colors duration-500 mx-auto mt-1"></div>
                <p className="editorial-caption text-vogue-silver mt-1">
                  MODELS
                </p>
              </div>
            </Link>
          </div>

          {/* Right - Search & User Actions */}
          <div className="flex items-center space-x-6">
            {/* Search (Protected Page Only) */}
            {isProtectedPage && (
              <div className="hidden md:block relative">
                <div className={`
                  relative transition-all duration-300 ease-out
                  ${isSearchFocused ? 'w-64' : 'w-48'}
                `}>
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-vogue-silver" />
                  <Input
                    type="text"
                    placeholder="Search talent..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="pl-10 pr-4 py-2 w-full bg-vogue-cream border-transparent focus:border-black focus:ring-0 rounded-none editorial-body text-sm"
                  />
                </div>
              </div>
            )}

            {/* User Actions */}
            {!isLoadingUser && (
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="hidden md:flex items-center space-x-2 text-black hover:text-vogue-gold transition-colors duration-300"
                    >
                      <User className="w-4 h-4" />
                      <span className="editorial-caption">Profile</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="hidden md:flex items-center space-x-2 text-black hover:text-vogue-gold transition-colors duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="editorial-caption">Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="hidden md:flex items-center space-x-4">
                    <Link 
                      href="/sign-in" 
                      className="editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/mua-sign-up" 
                      className="btn-luxury-outline px-6 py-2 text-xs"
                    >
                      Join as MUA
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-black hover:text-vogue-gold transition-colors duration-300"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-black/10 py-6 space-y-6">
            {/* Mobile Search */}
            {isProtectedPage && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-vogue-silver" />
                <Input
                  type="text"
                  placeholder="Search talent..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-3 w-full bg-vogue-cream border-transparent focus:border-black focus:ring-0 rounded-none"
                />
              </div>
            )}

            {/* Mobile Navigation */}
            <div className="space-y-4">
              <Link 
                href="/protected" 
                className="block editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Explore
              </Link>
              <Link 
                href="/about" 
                className="block editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    className="block editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block editorial-caption text-black hover:text-vogue-gold transition-colors duration-300 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/sign-in" 
                    className="block editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/mua-sign-up" 
                    className="block btn-luxury-outline px-6 py-3 text-xs text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join as MUA
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}