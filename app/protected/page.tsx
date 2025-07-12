"use client";

import { useState, useEffect, Suspense } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/ui/navbar";
import Image from 'next/image';
import { Palette, Brush, Camera, Sparkles, Eye, Heart, Monitor, Star, Search, ChevronDown, Filter, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import mock data and auth
import { mockUsers, getUsersByExpertise, searchUsers, expertiseTypes, priceRanges, levelTypes, locationTypes, filterUsers, MockUser, getUserCategory } from '@/data/mock-users';
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

// Simplified expertise icons mapping
const expertiseIcons = {
  'MUA': Palette,
  'MUSE': Camera
};

const expertiseColors = {
  'MUA': 'bg-rose-500',
  'MUSE': 'bg-purple-500'
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
  const [expertiseFilter, setExpertiseFilter] = useState('MUA');
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
      expertise: expertiseFilter,
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

          {/* Filter Bar - Vogue Style (MUA/MUSE only) */}
          <div className="mb-16">
            <div className="flex items-center justify-center gap-12 text-sm font-light tracking-widest">
              {expertiseTypes.map((expertise) => (
                <button
                  key={expertise}
                  onClick={() => setExpertiseFilter(expertise === expertiseFilter ? 'MUA' : expertise)}
                  className={cn(
                    "transition-all duration-300 hover:text-black pb-2",
                    expertiseFilter === expertise 
                      ? "text-black border-b border-black" 
                      : "text-gray-400"
                  )}
                >
                  {expertise}
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
                // Dynamic layout based on filter
                expertiseFilter === 'MUA' ? (
                  // MUA-specific layout: Vogue-inspired elegant design
                  <div className="space-y-1">
                    {filteredUsers.map((user) => (
                    // Each MUA gets one elegant row - entire card is clickable
                    <div 
                      key={user.id} 
                      onClick={() => router.push(`/mua/${user.id}`)}
                      className="group bg-white border-b border-gray-100 hover:bg-gray-50 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-stretch">
                        {/* User Info Section - Left */}
                        <div className="w-64 flex-shrink-0 px-8 py-8 flex flex-col justify-center">
                          <h3 className="text-xl font-light tracking-wide text-black mb-1 uppercase">
                            {user.displayName}
                          </h3>
                          <p className="text-sm font-medium tracking-widest text-gray-500 mb-6 uppercase">
                            {user.location}
                          </p>
                          
                          {/* Stats - Recommendations & Projects */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Recommended</span>
                              <span className="text-sm font-light text-black">{user.clientsReached}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Projects</span>
                              <span className="text-sm font-light text-black">{user.projectsCompleted}</span>
                            </div>
                          </div>
                        </div>

                        {/* 4 Pictures Grid - True 4:5 aspect ratio */}
                        <div className="flex-1 grid grid-cols-4">
                          {[...Array(4)].map((_, index) => {
                            // Create portfolio images by using different variations/filters of the main image
                            const portfolioImageUrl = `${user.imageUrl}&seed=${index}&q=90&w=320&h=400`;
                            
                            return (
                              <div key={index} className="relative overflow-hidden group/image aspect-[4/5]">
                                <Image
                                  src={portfolioImageUrl}
                                  alt={`${user.displayName} portfolio ${index + 1}`}
                                  fill
                                  className="object-cover transition-all duration-500 group-hover:brightness-110 group/image:hover:scale-105"
                                  sizes="25vw"
                                />
                                {/* Subtle overlay on hover */}
                                <div className="absolute inset-0 bg-black/0 group/image:hover:bg-black/10 transition-colors duration-300" />
                              </div>
                            );
                          })}
                        </div>

                        {/* Right Section - Arrow Indicator */}
                        <div className="w-16 flex-shrink-0 flex items-center justify-center bg-gray-50 group-hover:bg-black transition-colors duration-300">
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                ) : (
                  // MUSE layout: Regular grid for models and other talents
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                    {filteredUsers.map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                )
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
                      setExpertiseFilter('MUA');
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