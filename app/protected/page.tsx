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

// Import Supabase services and auth
import { userService, expertiseTypes, priceRanges, levelTypes, locationTypes, type CompleteUserProfile } from '@/services/user-service';
import { createClient } from '@/utils/supabase/client';

// Import components
import { UserCard, UserCardSkeleton } from "@/components/user-card";

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
  const [users, setUsers] = useState<CompleteUserProfile[]>([]);
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
        // Check authentication with Supabase
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/sign-in');
          return;
        }

        // Load users from Supabase
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
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

  const [filteredUsers, setFilteredUsers] = useState<CompleteUserProfile[]>([]);

  // Filter users based on all filters
  useEffect(() => {
    const filterUsers = async () => {
      if (users.length === 0) {
        setFilteredUsers([]);
        return;
      }
      
      // For now, use client-side filtering since the service expects async
      // TODO: Optimize this to use server-side filtering
      let filtered = users;
      
      // Filter by expertise/user type
      if (expertiseFilter && expertiseFilter !== 'Semua Expertise') {
        filtered = filtered.filter(user => 
          user.user_type === expertiseFilter.toLowerCase()
        );
      }
      
      // Filter by location
      if (locationFilter && locationFilter !== 'Semua Lokasi') {
        filtered = filtered.filter(user => user.location === locationFilter);
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          user.display_name.toLowerCase().includes(query) ||
          (user.expertise && user.expertise.toLowerCase().includes(query)) ||
          (user.location && user.location.toLowerCase().includes(query))
        );
      }
      
      setFilteredUsers(filtered);
    };
    
    filterUsers();
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

          {/* Vogue Editorial Filter Bar */}
          <div className="mb-20">
            <div className="text-center">
              <h2 className="editorial-headline text-black mb-8">
                Discover Talent
              </h2>
              <div className="flex items-center justify-center gap-16">
                {expertiseTypes.map((expertise) => (
                  <button
                    key={expertise}
                    onClick={() => setExpertiseFilter(expertise === expertiseFilter ? 'MUA' : expertise)}
                    className={cn(
                      "group relative transition-all duration-500 pb-4",
                      expertiseFilter === expertise 
                        ? "text-black" 
                        : "text-vogue-silver hover:text-black"
                    )}
                  >
                    <span className="editorial-caption tracking-[0.2em]">
                      {expertise}
                    </span>
                    
                    {/* Elegant underline */}
                    <div className={cn(
                      "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-px bg-black transition-all duration-500",
                      expertiseFilter === expertise 
                        ? "w-full" 
                        : "w-0 group-hover:w-full"
                    )} />
                    
                    {/* Gold accent dot */}
                    {expertiseFilter === expertise && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-vogue-gold rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Divider line */}
              <div className="mt-12 mb-8">
                <div className="w-32 h-px bg-black mx-auto" />
              </div>
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
                // Show skeleton cards during loading with proper layout
                expertiseFilter === 'MUA' ? (
                  <div className="space-y-0">
                    {[...Array(8)].map((_, i) => (
                      <UserCardSkeleton key={i} layout="editorial" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(12)].map((_, i) => (
                      <UserCardSkeleton key={i} layout="grid" />
                    ))}
                  </div>
                )
              ) : filteredUsers.length > 0 ? (
                // Dynamic layout based on filter
                expertiseFilter === 'MUA' ? (
                  // MUA-specific layout: Vogue-inspired editorial design
                  <div className="space-y-0">
                    {filteredUsers.map((user) => (
                      <UserCard 
                        key={user.id} 
                        user={user} 
                        layout="editorial"
                        onCollaborate={(user) => router.push(`/mua/${user.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  // MUSE layout: Fashion editorial grid for models
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredUsers.map((user) => (
                      <UserCard 
                        key={user.id} 
                        user={user} 
                        layout="grid"
                        onCollaborate={(user) => router.push(`/mua/${user.id}`)}
                      />
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