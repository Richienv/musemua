"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from 'next/navigation';
import { Search } from "lucide-react";

interface NavbarProps {
  onFilterChange?: (value: string) => void;
}

export function Navbar({ onFilterChange }: NavbarProps) {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [dashboardLink, setDashboardLink] = useState("/");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingUser(true);
      const currentUser = MockAuth.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        if (currentUser.userType === 'streamer') {
          setDashboardLink("/streamer-dashboard");
        } else if (currentUser.userType === 'client') {
          setDashboardLink("/protected");
        } else {
          setDashboardLink("/admin");
        }
      }
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
    await MockAuth.logout();
    router.push('/');
  };

  const isProtectedPage = pathname === '/protected';

  return (
    <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Center - Brand Only */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="text-2xl font-bold tracking-wider text-black">
              MUSEMODELS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}