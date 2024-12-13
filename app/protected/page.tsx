"use client";

import { useState, useEffect, Suspense } from 'react';
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Navbar } from "@/components/ui/navbar";
import Image from 'next/image';
import { Smartphone, ShoppingBag, Camera, Gamepad, Mic, Coffee } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

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

// Add back the necessary interfaces and constants
const categories = [
  { name: 'Tech', icon: Smartphone, color: 'bg-blue-500' },
  { name: 'Fashion', icon: ShoppingBag, color: 'bg-pink-500' },
  { name: 'Beauty', icon: Camera, color: 'bg-purple-500' },
  { name: 'Gaming', icon: Gamepad, color: 'bg-green-500' },
  { name: 'Music', icon: Mic, color: 'bg-yellow-500' },
  { name: 'Lifestyle', icon: Coffee, color: 'bg-red-500' },
];

const carouselImages = [
  "/images/ads.svg",
  "/images/ads.svg",
  "/images/ads.svg",
  "/images/ads.svg",
  "/images/ads.svg",
];

export default function ProtectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
        await fetchStreamers(); // Move streamer fetching to separate function

      } catch (error) {
        console.error('Error in validateUserAccess:', error);
        toast.error('An unexpected error occurred');
        router.push('/sign-in');
      }
    };

    validateUserAccess();
  }, [router]);

  // Separate function for fetching streamers
  const fetchStreamers = async () => {
    const supabase = createClient();
    const { data: streamersData, error: streamersError } = await supabase
      .from('streamers')
      .select('*');

    if (streamersError) {
      console.error('Error fetching streamers:', streamersError);
      toast.error('Error loading streamers');
      return;
    }

    setStreamers(streamersData || []);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Add filtered streamers computation
  const filteredStreamers = streamers.filter((streamer) => {
    const lowercasedFilter = filter.toLowerCase();
    const matchesTextFilter = 
      streamer.first_name.toLowerCase().includes(lowercasedFilter) ||
      streamer.last_name.toLowerCase().includes(lowercasedFilter) ||
      streamer.platform.toLowerCase().includes(lowercasedFilter) ||
      streamer.category.toLowerCase().includes(lowercasedFilter);
    
    const matchesCategoryFilter = categoryFilter ? streamer.category === categoryFilter : true;

    return matchesTextFilter && matchesCategoryFilter;
  });

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar onFilterChange={handleFilterChange} />
      
      {/* Category Filter */}
      <Suspense fallback={
        <div className="h-20 bg-white border-b border-gray-200 animate-pulse" />
      }>
        {/* Your existing category filter code... */}
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<MainContentSkeleton />}>
        <div className="w-full px-2 sm:px-4 lg:px-6 py-6 md:py-8">
          <div className="max-w-[1440px] mx-auto">
            {/* Carousel */}
            <Suspense fallback={
              <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg mb-6 md:mb-10" />
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
                        className="rounded-lg w-full"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </Slider>
              </div>
            </Suspense>
            
            <hr className="border-t border-gray-200 my-6 md:my-8" />

            {/* Headings */}
            <h2 className="text-2xl md:text-3xl mb-2 text-gray-800 first-letter:text-3xl md:first-letter:text-4xl px-2 md:px-0">
              Salda Top Streamer
            </h2>
            
            <hr className="border-t border-gray-200 my-4 md:my-5" />

            {/* StreamerList */}
            <div className="px-2 md:px-4 lg:px-6">
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              }>
                <StreamerList 
                  initialStreamers={filteredStreamers} 
                  filter={filter} 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                />
              </Suspense>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  );
}

// Skeleton component for main content
function MainContentSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg mb-6 md:mb-10"></div>
        <hr className="border-t border-gray-200 my-6 md:my-8" />
        <div className="h-8 bg-gray-200 animate-pulse rounded mb-4"></div>
        <hr className="border-t border-gray-200 my-4 md:my-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
