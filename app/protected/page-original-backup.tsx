"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Navbar } from "@/components/ui/navbar";
import Image from 'next/image';
import { Smartphone, ShoppingBag, Camera, Gamepad, Mic, Coffee, Monitor, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Dynamically import components
const StreamerList = dynamic(() => import("@/components/streamer-list").then(mod => mod.StreamerList), {
  loading: () => (
    <div className="w-full h-[200px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
});

const Slider = dynamic(() => import("react-slick"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
  )
});

const AvailabilityFilter = dynamic(() => import("@/components/availability-filter").then(mod => mod.AvailabilityFilter), {
  loading: () => <div className="w-10 h-10 bg-gray-100 animate-pulse rounded-lg"></div>
});

// Import slick carousel styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FilterModal } from '@/components/filter-modal';

// Add back the necessary interfaces and constants
const categories = [
  { name: 'Tech', icon: Smartphone, color: 'bg-blue-500' },
  { name: 'Fashion', icon: ShoppingBag, color: 'bg-pink-500' },
  { name: 'Beauty', icon: Camera, color: 'bg-purple-500' },
  { name: 'Gaming', icon: Gamepad, color: 'bg-green-500' },
  { name: 'Music', icon: Mic, color: 'bg-yellow-500' },
  { name: 'Lifestyle', icon: Coffee, color: 'bg-red-500' },
  { name: 'Digital', icon: Monitor, color: 'bg-indigo-500' },
  { name: 'Other', icon: Sparkles, color: 'bg-gray-500' },
];

const carouselImages = [
  "/images/banner-salda-01.jpg",
  "/images/banner-salda-02.jpg",
  "/images/banner-salda-03.jpg",
];

// Add these constants at the top
const STREAMERS_PER_PAGE = 12;
const INITIAL_LOAD_DELAY = 100; // ms

// Add FilterState interface
interface FilterState {
  priceRange: [number, number];
  location: string;
  platforms: string[];
  minRating: number;
}

// Add this helper function
const hasActiveFilters = (filters: FilterState) => {
  return filters.location !== '' ||
    filters.platforms.length > 0 ||
    filters.minRating > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000000;
};

export default function ProtectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [isLoadingStreamers, setIsLoadingStreamers] = useState(true);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: [0, 1000000],
    location: '',
    platforms: [],
    minRating: 0,
  });

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
    const validateUserAccess = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('Authentication error:', authError);
          router.push('/sign-in');
          return;
        }

        // Fetch user type from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          toast.error('Error validating user access');
          router.push('/sign-in');
          return;
        }

        // Redirect streamers to their dashboard
        if (userData?.user_type === 'streamer') {
          toast.error('Access denied. Redirecting to streamer dashboard...');
          router.push('/streamer-dashboard');
          return;
        }

        // If user type is not set or invalid, redirect to sign in
        if (!userData?.user_type || userData.user_type !== 'client') {
          toast.error('Invalid user type. Please sign in again.');
          router.push('/sign-in');
          return;
        }

        // Valid client user - proceed with data fetching
        setUser(user);
        await fetchStreamers();

      } catch (error) {
        console.error('Error in validateUserAccess:', error);
        toast.error('An unexpected error occurred');
        router.push('/sign-in');
      }
    };

    validateUserAccess();
  }, [router]);

  // Updated function for fetching streamers
  const fetchStreamers = async () => {
    setIsLoadingStreamers(true);
    try {
      const response = await fetch('/api/streamers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch streamers');
      }

      console.log('Fetched streamers with discount info:', data.streamers);
      setStreamers(data.streamers || []);
    } catch (error) {
      console.error('Error fetching streamers:', error);
      toast.error('Error loading streamers');
    } finally {
      setIsLoadingStreamers(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Update filteredStreamers computation
  const filteredStreamers = streamers.filter((streamer) => {
    // Text search filter
    const lowercasedFilter = filter.toLowerCase();
    const matchesTextFilter = 
      streamer.first_name.toLowerCase().includes(lowercasedFilter) ||
      streamer.last_name.toLowerCase().includes(lowercasedFilter) ||
      streamer.platform.toLowerCase().includes(lowercasedFilter) ||
      streamer.category.toLowerCase().includes(lowercasedFilter);
    
    // Category filter
    const matchesCategoryFilter = !categoryFilter || 
      streamer.category.toLowerCase().split(',').map((cat: string) => 
        cat.trim().toLowerCase()
      ).includes(categoryFilter.toLowerCase());

    // Price range filter
    const matchesPriceRange = 
      streamer.price >= activeFilters.priceRange[0] && 
      streamer.price <= activeFilters.priceRange[1];

    // Location filter
    const matchesLocation = 
      !activeFilters.location || 
      streamer.location.toLowerCase().includes(activeFilters.location.toLowerCase());

    // Platform filter
    const matchesPlatform = 
      activeFilters.platforms.length === 0 || 
      (() => {
        // Split streamer's platforms into an array and normalize
        const streamerPlatforms = streamer.platform.toLowerCase().split(',').map((p: string) => p.trim());
        
        // Check if any of the selected platforms match
        return activeFilters.platforms.every(p => streamerPlatforms.includes(p.toLowerCase()));
      })();

    // Rating filter
    const matchesRating = 
      streamer.rating >= activeFilters.minRating;

    return (
      matchesTextFilter && 
      matchesCategoryFilter && 
      matchesPriceRange && 
      matchesLocation && 
      matchesPlatform && 
      matchesRating
    );
  });

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
  };

  // Create the StreamerCardSkeleton component
  const StreamerCardSkeleton = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
        {/* Image placeholder */}
        <div className="w-full h-[180px] bg-gray-200"></div>
        
        {/* Content area */}
        <div className="p-4 space-y-4">
          {/* Name placeholder */}
          <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
          
          {/* Location placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-200"></div>
            <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
          </div>
          
          {/* Category/Platform placeholders */}
          <div className="flex gap-2 flex-wrap">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          
          {/* Rating placeholder */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-gray-200"></div>
              <div className="h-4 bg-gray-200 rounded-md w-12"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded-md w-16"></div>
          </div>
          
          {/* Button placeholder */}
          <div className="h-10 bg-gray-200 rounded-lg w-full mt-2"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#faf9f6]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100">
        <Navbar onFilterChange={handleFilterChange} />
      </header>

      {/* Main Content */}
      <Suspense fallback={<MainContentSkeleton />}>
        <main className="w-full px-6 sm:px-8 lg:px-12 py-6 md:py-8 mt-[80px] bg-[#faf9f6]">
          <div className="max-w-[1600px] mx-auto">
            {/* Carousel */}
            <Suspense fallback={
              <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-xl mb-6 md:mb-10" />
            }>
              <div className="w-full mb-6 md:mb-10">
                <Slider {...settings}>
                  {carouselImages.map((image, index: number) => (
                    <div key={index} className="outline-none px-1">
                      <Image
                        src={image}
                        alt={`Carousel image ${index + 1}`}
                        width={1200}
                        height={400}
                        objectFit="cover"
                        className="rounded-xl w-full"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </Slider>
              </div>
            </Suspense>

            {/* Category Filter */}
            <Suspense fallback={
              <div className="h-20 bg-white border border-gray-100 rounded-xl animate-pulse mb-8" />
            }>
              <nav className="bg-white border border-gray-100 rounded-xl mb-8 shadow-sm">
                <div className="relative px-6 sm:px-8">
                  <div className="flex items-center -mx-3 overflow-x-auto scrollbar-hide py-4">
                    <div className="flex items-center gap-8 px-3">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          onClick={() => setCategoryFilter(category.name === categoryFilter ? '' : category.name)}
                          className="flex flex-col items-center min-w-[56px] group interactive-element"
                        >
                          <div className={`p-2.5 rounded-lg ${
                            categoryFilter === category.name 
                              ? 'bg-black shadow-md' 
                              : 'bg-gray-50 hover:bg-gray-100'
                            } transition-optimized`}
                          >
                            <category.icon className={`w-5 h-5 ${
                              categoryFilter === category.name ? 'text-white' : 'text-gray-700'
                            }`} />
                          </div>
                          <span className={`mt-2 text-xs font-medium whitespace-nowrap ${
                            categoryFilter === category.name 
                              ? 'text-black' 
                              : 'text-gray-600'
                          }`}>
                            {category.name}
                          </span>
                          {categoryFilter === category.name && (
                            <div className="h-0.5 w-6 bg-black rounded-full mt-1" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Filter Button */}
                    <div className="pl-6 ml-6 border-l border-gray-200">
                      <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-optimized",
                          hasActiveFilters(activeFilters)
                            ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "border-gray-300 hover:border-gray-400"
                        )}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={cn(
                            "transition-optimized",
                            hasActiveFilters(activeFilters) ? "stroke-blue-600" : "stroke-current"
                          )}
                        >
                          <path 
                            d="M2 4h12M4 8h8M6 12h4" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {hasActiveFilters(activeFilters) ? 'Filters active' : 'Filter'}
                        </span>
                        {hasActiveFilters(activeFilters) && (
                          <span className="flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                            {Object.values(activeFilters).filter(value => 
                              Array.isArray(value) ? value[0] > 0 || value[1] < 1000000 : value
                            ).length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </nav>
            </Suspense>

            {/* StreamerList with Loading State */}
            <div className="px-0">
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              }>
                {isLoadingStreamers ? (
                  // Show skeleton cards during loading
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
                    {[...Array(12)].map((_, i) => (
                      <StreamerCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredStreamers.length > 0 ? (
                  <StreamerList 
                    initialStreamers={filteredStreamers}
                    filter={filter}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <Image
                      src="/images/sorry.png"
                      alt="No results found"
                      width={240}
                      height={240}
                      className="mb-8"
                    />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No streamers found
                    </h3>
                    <p className="text-gray-600 text-center max-w-md mb-8">
                      Maaf, kami tidak dapat menemukan streamer yang sesuai dengan filter Anda. Coba sesuaikan kriteria pencarian atau jelajahi pilihan lainnya.
                    </p>
                    <Button
                      onClick={() => {
                        setActiveFilters({
                          priceRange: [0, 1000000],
                          location: '',
                          platforms: [],
                          minRating: 0,
                        });
                        setCategoryFilter('');
                        setFilter('');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white transition-optimized"
                    >
                      Bersihkan Semua Filter
                    </Button>
                  </div>
                )}
              </Suspense>
            </div>
          </div>
        </main>
      </Suspense>

      {/* Add FilterModal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters}
      />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
