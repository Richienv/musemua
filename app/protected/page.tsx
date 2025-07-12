"use client";

import { useState, useEffect, Suspense } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/ui/navbar";
import Image from 'next/image';
import { Palette, Brush, Camera, Sparkles, Eye, Heart, Monitor, Star, Search, ChevronDown, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import mock data and auth
import { mockUsers, getUsersByExpertise, searchUsers, expertiseTypes, priceRanges, levelTypes, locationTypes, filterUsers, MockUser } from '@/data/mock-users';
import { MockAuth } from '@/utils/mock-auth';

// Dynamically import components
const UserCard = dynamic(() => import("@/components/user-card").then(mod => mod.UserCard), {
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-xl"></div>
  )
});

const Slider = dynamic(() => import("react-slick"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
  )
});

// Import slick carousel styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Expertise icons mapping
const expertiseIcons = {
  'MUA Ahli': Palette,
  'MUA Bersertifikat': Brush,
  'MUA Profesional': Palette,
  'MUA Pemula': Brush,
  'Konsultan Kecantikan': Eye,
  'Ahli Kecantikan Kreatif': Sparkles,
  'Spesialis Kecantikan Senior': Star,
  'Stylist Kecantikan Ahli': Heart,
  'Direktur Kreatif': Monitor,
  'Direktur Seni': Monitor,
  'Spesialis Fotografi': Camera
};

const expertiseColors = {
  'MUA Ahli': 'bg-rose-500',
  'MUA Bersertifikat': 'bg-pink-400',
  'MUA Profesional': 'bg-rose-600',
  'MUA Pemula': 'bg-pink-300',
  'Konsultan Kecantikan': 'bg-purple-400',
  'Ahli Kecantikan Kreatif': 'bg-fuchsia-500',
  'Spesialis Kecantikan Senior': 'bg-amber-500',
  'Stylist Kecantikan Ahli': 'bg-red-500',
  'Direktur Kreatif': 'bg-indigo-500',
  'Direktur Seni': 'bg-indigo-600',
  'Spesialis Fotografi': 'bg-emerald-500'
};

const carouselImages = [
  "/images/banner-salda-01.jpg",
  "/images/banner-salda-02.jpg", 
  "/images/banner-salda-03.jpg",
];

export default function ProtectedPage() {
  const router = useRouter();
  const [users, setUsers] = useState<MockUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('Semua Expertise');
  const [priceFilter, setPriceFilter] = useState('Semua Harga');
  const [levelFilter, setLevelFilter] = useState('Semua Level');
  const [locationFilter, setLocationFilter] = useState('Semua Lokasi');
  const [showFilters, setShowFilters] = useState(false);

  // Add carousel settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check authentication with mock auth
        if (!MockAuth.isAuthenticated()) {
          router.push('/sign-in');
          return;
        }

        // Check if user is client (not streamer)
        const currentUser = MockAuth.getCurrentUser();
        if (currentUser?.userType === 'streamer') {
          router.push('/streamer-dashboard');
          return;
        }

        // Load mock users
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
        setUsers(mockUsers);
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Filter users based on all filters
  const filteredUsers = React.useMemo(() => {
    if (users.length === 0) return [];
    
    return filterUsers({
      searchQuery,
      expertise: expertiseFilter !== 'Semua Expertise' ? expertiseFilter : undefined,
      priceRange: priceFilter !== 'Semua Harga' ? priceFilter : undefined,
      level: levelFilter !== 'Semua Level' ? levelFilter : undefined,
      location: locationFilter !== 'Semua Lokasi' ? locationFilter : undefined
    });
  }, [users, searchQuery, expertiseFilter, priceFilter, levelFilter, locationFilter]);

  // User Card Skeleton Component
  const UserCardSkeleton = () => {
    return (
      <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-pulse h-[500px]">
        <div className="w-full h-full bg-gray-200"></div>
        <div className="absolute top-4 left-4 right-4">
          <div className="h-6 bg-gray-300 rounded-md w-3/4"></div>
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100">
        <Navbar onFilterChange={handleSearchChange} />
      </header>

      {/* Main Content */}
      <main className="w-full px-6 sm:px-8 lg:px-12 py-8 mt-[80px] bg-white">
        <div className="max-w-[1600px] mx-auto">

          {/* Filter Bar - Minimal */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium">
              {expertiseTypes.map((expertise) => (
                <button
                  key={expertise}
                  onClick={() => setExpertiseFilter(expertise === expertiseFilter ? 'Semua Expertise' : expertise)}
                  className={cn(
                    "transition-colors hover:text-gray-900",
                    expertiseFilter === expertise 
                      ? "text-black border-b-2 border-black pb-1" 
                      : "text-gray-500"
                  )}
                >
                  {expertise.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* User Grid */}
          <div className="px-0">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            }>
              {isLoading ? (
                // Show skeleton cards during loading
                <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                  {[...Array(20)].map((_, i) => (
                    <UserCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                  {filteredUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Search className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Tidak ada ahli kecantikan ditemukan
                  </h3>
                  <p className="text-gray-600 text-center max-w-md mb-8">
                    Maaf, kami tidak dapat menemukan ahli kecantikan yang sesuai dengan pencarian Anda. Coba sesuaikan filter untuk menemukan MUA berbakat lainnya.
                  </p>
                  <Button
                    onClick={() => {
                      setExpertiseFilter('Semua Expertise');
                      setPriceFilter('Semua Harga');
                      setLevelFilter('Semua Level');
                      setLocationFilter('Semua Lokasi');
                      setSearchQuery('');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Hapus Semua Filter
                  </Button>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

// Skeleton component for main content
function MainContentSkeleton() {
  return (
    <div className="w-full px-1 sm:px-2 lg:px-4 py-6 md:py-8">
      <div className="max-w-[1920px] mx-auto">
        <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg mb-6 md:mb-10"></div>
        <hr className="border-t border-gray-200 my-6 md:my-8" />
        <div className="h-8 bg-gray-200 animate-pulse rounded mb-4"></div>
        <hr className="border-t border-gray-200 my-4 md:my-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[500px] bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}