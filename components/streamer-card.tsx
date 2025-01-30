import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Star, StarHalf, MapPin, ChevronLeft, ChevronRight, User, Calendar, Clock, Monitor, DollarSign, X, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { createClient } from "@/utils/supabase/client";
import { format, addDays, startOfWeek, addWeeks, isSameDay, endOfWeek, isAfter, isBefore, startOfDay, subWeeks, addHours, parseISO, differenceInHours } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createOrGetConversation } from '@/services/message-service';
import { BookingCalendar } from './booking-calendar';
import { cn } from '@/lib/utils';

// Add this function at the top of your file, outside of the StreamerCard component
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle youtu.be URLs
  const shortUrlRegex = /youtu\.be\/([a-zA-Z0-9_-]+)/;
  const shortMatch = url.match(shortUrlRegex);
  if (shortMatch) {
    console.log("Extracted Video ID (short URL):", shortMatch[1]);
    return shortMatch[1];
  }

  // Handle youtube.com URLs
  const standardRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)([^#\&\?]*)/;
  const match = url.match(standardRegex);
  if (match && match[1].length === 11) {
    console.log("Extracted Video ID (standard URL):", match[1]);
    return match[1];
  }

  console.log("No valid YouTube video ID found in URL:", url);
  return null;
}

// Add these utility functions at the top of the file
const calculateDuration = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
};

// Add this utility function for calculating platform fee
const calculatePriceWithPlatformFee = (basePrice: number): number => {
  const platformFeePercentage = 30;
  return basePrice * (1 + platformFeePercentage / 100);
};

// Add this utility function at the top of the file
const convertToUTC = (date: Date, hour: number): Date => {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// Update the Streamer interface to include new fields
export interface Streamer {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  platform: string;
  platforms?: string[];
  category: string;
  categories?: string[];
  rating: number;
  price: number;
  previous_price?: number | null;
  last_price_update?: string;
  price_history?: {
    previous_price: number;
    new_price: number;
    effective_from: string;
  }[];
  image_url: string;
  bio: string;
  location: string;
  video_url: string | null;
  availableTimeSlots?: string[];
  discount_percentage?: number | null;
  gender?: string;
  age?: number;
  experience?: string;
}

// Update the testimonial interface
interface Testimonial {
  client_name: string;
  comment: string;
  rating: number;
}

// Update the StreamerProfile interface
interface StreamerProfile extends Streamer {
  fullBio: string;
  gallery: {
    photos: { id: number; photo_url: string; order_number: number }[];
  };
  testimonials: Testimonial[];
}

// Update the rating data type
interface RatingData {
  id: number;
  rating: number;
  comment: string;
  client: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

type ShippingOption = 'yes' | 'no';

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center font-sans">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
        <Star key={i + fullStars + (hasHalfStar ? 1 : 0)} className="w-3 h-3 text-gray-300" />
      ))}
      <span className="ml-1 text-[10px] text-foreground/70">
        {rating > 0 ? rating.toFixed(1) : "Not rated yet"}
      </span>
    </div>
  );
}

function formatPrice(price: number): string {
  if (price < 1000) {
    return `Rp ${price}/hour`;
  }
  const firstTwoDigits = Math.floor(price / 1000);
  return `Rp ${firstTwoDigits}K/hour`;
}

// First, add a helper function to format the name
function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.charAt(0)}.`;
}

// Update the formatDiscount function
function formatDiscount(basePrice: number, previousPrice?: number | null, discountPercentage?: number | null): {
  displayPrice: string;
  originalPrice?: string;
  discountPercentage?: number;
} {
  // Calculate prices with platform fee
  const currentPriceWithFee = calculatePriceWithPlatformFee(basePrice);
  const previousPriceWithFee = previousPrice ? calculatePriceWithPlatformFee(previousPrice) : null;

  console.log('Price values in formatDiscount:', {
    basePrice,
    previousPrice,
    discountPercentage,
    currentPriceWithFee,
    previousPriceWithFee,
    hasValidDiscount: Boolean(previousPrice && discountPercentage && discountPercentage > 0)
  });

  // Show discount if we have valid previous price and discount percentage
  if (previousPrice && previousPriceWithFee && discountPercentage && discountPercentage > 0) {
    console.log('Showing discount UI with:', {
      displayPrice: `Rp ${Math.round(currentPriceWithFee).toLocaleString('id-ID')}`,
      originalPrice: `Rp ${Math.round(previousPriceWithFee).toLocaleString('id-ID')}`,
      discountPercentage
    });

    return {
      displayPrice: `Rp ${Math.round(currentPriceWithFee).toLocaleString('id-ID')}`,
      originalPrice: `Rp ${Math.round(previousPriceWithFee).toLocaleString('id-ID')}`,
      discountPercentage
    };
  }

  // Default case: just return current price
  return { 
    displayPrice: `Rp ${Math.round(currentPriceWithFee).toLocaleString('id-ID')}` 
  };
}

// First, add this helper function at the top of the file
const getTimeSlots = (timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night'): string[] => {
  switch (timeOfDay) {
    case 'Morning':
      return Array.from({ length: 6 }, (_, i) => `${(6 + i).toString().padStart(2, '0')}:00`);
    case 'Afternoon':
      return Array.from({ length: 6 }, (_, i) => `${(12 + i).toString().padStart(2, '0')}:00`);
    case 'Evening':
      return Array.from({ length: 6 }, (_, i) => `${(18 + i).toString().padStart(2, '0')}:00`);
    case 'Night':
      return Array.from({ length: 6 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  }
};

// First, update the timeOptions type and add necessary interfaces
interface TimeOption {
  hour: string;
  available: boolean;
}

// Add this type guard function
const isTimeOption = (value: unknown): value is string => {
  return typeof value === 'string' && /^\d{2}:00$/.test(value);
};

// Add this function at the top level
const fetchExtendedProfileBasic = async (streamerId: number) => {
  const supabase = createClient();
  try {
    // Fetch all necessary data in parallel
    const [streamerResult, profileResult, ratingResult] = await Promise.all([
      // Basic streamer data
      supabase
        .from('streamers')
        .select(`
          id,
          first_name,
          last_name,
          platform,
          category,
          rating,
          price,
          image_url,
          bio,
          location,
          video_url
        `)
        .eq('id', streamerId)
        .single(),
      
      // Profile details
      supabase
        .from('streamer_profiles')
        .select(`
          age,
          gender,
          experience,
          fullBio,
          location,
          additional_info
        `)
        .eq('streamer_id', streamerId)
        .single(),
      
      // Average rating
      supabase
        .rpc('get_streamer_average_rating', { streamer_id_param: streamerId })
    ]);

    if (streamerResult.error) {
      console.error('Error fetching streamer data:', streamerResult.error);
      throw streamerResult.error;
    }

    // Log the fetched data for debugging
    console.log('Fetched profile data:', {
      streamer: streamerResult.data,
      profile: profileResult.data,
      rating: ratingResult.data
    });

    // Combine all the data with proper fallbacks
    const combinedData = {
      ...streamerResult.data,
      age: profileResult.data?.age || null,
      gender: profileResult.data?.gender || 'Not specified',
      experience: profileResult.data?.experience || 'Not specified',
      fullBio: profileResult.data?.fullBio || streamerResult.data.bio,
      rating: ratingResult.data || streamerResult.data.rating,
      video_url: streamerResult.data.video_url,
      location: profileResult.data?.location || streamerResult.data.location,
      additional_info: profileResult.data?.additional_info || {}
    };

    console.log('Combined profile data:', combinedData);
    return combinedData;
  } catch (error) {
    console.error('Error in fetchExtendedProfileBasic:', error);
    return null;
  }
};

interface RatingWithProfile {
  id: number;
  rating: number;
  comment: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
  created_at: string;
}

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const router = useRouter();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [extendedProfile, setExtendedProfile] = useState<StreamerProfile | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(streamer.rating);
  
  // Add loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);
  const profileCache = useRef<Partial<StreamerProfile> | null>(null);

  // Lazy load these states only when needed
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [platform, setPlatform] = useState(streamer.platform);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [needsShipping, setNeedsShipping] = useState<ShippingOption>('no');
  const [clientLocation, setClientLocation] = useState<string>('');

  const isMinimumBookingMet = selectedHours.length >= 2;

  // Load extended profile only when profile modal is opened
  useEffect(() => {
    if (isProfileModalOpen && !extendedProfile) {
      fetchExtendedProfile().catch(error => {
        console.error('Error in profile modal effect:', error);
        setIsLoadingProfile(false);
        setIsLoadingGallery(false);
        setIsLoadingTestimonials(false);
      });
    }
  }, [isProfileModalOpen]);

  // Load schedule and bookings only when booking modal is opened
  useEffect(() => {
    if (isBookingModalOpen) {
      fetchActiveSchedule();
      fetchAcceptedBookings();
    }
  }, [isBookingModalOpen]);

  // Optimize subscription setup
  useEffect(() => {
    const supabase = createClient();
    
    // Only subscribe to real-time updates if the profile modal is open
    if (!isProfileModalOpen) return;

    const ratingSubscription = supabase
      .channel('public:streamer_ratings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'streamer_ratings', filter: `streamer_id=eq.${streamer.id}` },
        () => {
          fetchExtendedProfile();
        }
      )
      .subscribe();

    const profileSubscription = supabase
      .channel('public:streamers')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'streamers', filter: `id=eq.${streamer.id}` },
        () => {
          fetchExtendedProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ratingSubscription);
      supabase.removeChannel(profileSubscription);
    };
  }, [streamer.id, isProfileModalOpen]);

  // Prefetch data for better UX
  const openBookingModal = () => {
    // Prefetch schedule and bookings before opening modal
    Promise.all([
      fetchActiveSchedule(),
      fetchAcceptedBookings()
    ]).then(() => {
      setIsBookingModalOpen(true);
    });
  };

  useEffect(() => {
    fetchActiveSchedule();
    fetchDaysOff();
    fetchAcceptedBookings();

    const supabase = createClient();
    
    // Subscribe to booking changes
    const bookingSubscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings', filter: `streamer_id=eq.${streamer.id}` },
        () => {
          fetchActiveSchedule();
          fetchDaysOff();
          fetchAcceptedBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSubscription);
    };
  }, [streamer.id]);

  useEffect(() => {
    if (isProfileModalOpen && extendedProfile?.gallery?.photos?.[0]?.photo_url) {
      setSelectedImage(extendedProfile.gallery.photos[0].photo_url);
    }
  }, [extendedProfile, isProfileModalOpen]);

  useEffect(() => {
    const fetchClientLocation = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();
        
        if (profile?.location) {
          setClientLocation(profile.location);
        }
      }
    };

    fetchClientLocation();
  }, []);

  // Prefetch basic profile data on hover
  const prefetchProfile = useCallback(async () => {
    if (profileCache.current) return;
    
    try {
      const basicProfile = await fetchExtendedProfileBasic(streamer.id);
      profileCache.current = {
        ...streamer,
        ...basicProfile
      };
    } catch (error) {
      console.error('Error prefetching profile:', error);
    }
  }, [streamer.id]);

  // Progressive profile loading
  const fetchExtendedProfile = async () => {
    // Clear the cache to ensure fresh data
    profileCache.current = null;

    setIsLoadingProfile(true);
    const supabase = createClient();

    try {
      // Fetch basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('streamers')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          bio,
          location,
          video_url,
          gender,
          age,
          experience,
          rating,
          platform,
          category,
          price,
          image_url
        `)
        .eq('id', streamer.id)
        .single();

      if (profileError) throw profileError;

      // Fetch gallery photos
      const { photos } = await fetchGallery();
      
      // Fetch testimonials
      const testimonials = await fetchTestimonials();

      const extendedProfileData: StreamerProfile = {
        ...profileData,
        gallery: { photos },
        testimonials,
        fullBio: profileData.bio,
        // Ensure all required properties are included
        platforms: profileData.platform ? [profileData.platform] : [],
        categories: profileData.category ? [profileData.category] : [],
        availableTimeSlots: [],
        discount_percentage: null,
        previous_price: null,
        last_price_update: undefined,
        price_history: []
      };

      setExtendedProfile(extendedProfileData);
      profileCache.current = extendedProfileData;

    } catch (error) {
      console.error('Error fetching extended profile:', error);
      setExtendedProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchGallery = async () => {
    setIsLoadingGallery(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('streamer_gallery_photos') // Fix: correct table name
        .select('*')
        .eq('streamer_id', streamer.id)
        .order('order_number');
      
      if (error) throw error;
      return { photos: data || [] };
    } catch (error) {
      console.error('Error fetching gallery:', error);
      return { photos: [] };
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const fetchTestimonials = async () => {
    setIsLoadingTestimonials(true);
    const supabase = createClient();
    try {
      const { data: rawData, error } = await supabase
        .from('streamer_ratings')
        .select(`
          id,
          rating,
          comment,
          profiles:client_id (
            first_name,
            last_name
          ),
          created_at
        `)
        .eq('streamer_id', streamer.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;

      const data = rawData as unknown as RatingWithProfile[];
      
      return data.map(rating => ({
        client_name: rating.profiles ? `${rating.profiles.first_name} ${rating.profiles.last_name.charAt(0)}.` : 'Anonymous',
        comment: rating.comment || '',
        rating: rating.rating || 0
      }));
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    } finally {
      setIsLoadingTestimonials(false);
    }
  };

  // Add hover event handlers to the card
  const handleCardHover = () => {
    prefetchProfile();
  };

  const fetchActiveSchedule = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('streamer_active_schedules')
      .select('schedule')
      .eq('streamer_id', streamer.id);

    if (error) {
      console.error('Error fetching active schedule:', error);
      setActiveSchedule(null); // Set to null instead of default schedule
    } else if (data && data.length > 0) {
      try {
        const schedule = typeof data[0].schedule === 'string' 
          ? JSON.parse(data[0].schedule)
          : data[0].schedule;
        setActiveSchedule(schedule);
      } catch (e) {
        console.error('Error parsing schedule:', e);
        setActiveSchedule(null); // Set to null on parse error
      }
    } else {
      setActiveSchedule(null); // Set to null when no schedule exists
    }
  };

  const fetchDaysOff = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('streamer_day_offs')
      .select('date')
      .eq('streamer_id', streamer.id);

    if (error) {
      console.error('Error fetching days off:', error);
    } else if (data) {
      setDaysOff(data.map(d => d.date));
    }
  };

  const fetchAcceptedBookings = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('streamer_id', streamer.id)
      .in('status', ['accepted', 'pending']);

    if (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } else {
      console.log('Fetched bookings:', data); // Add this line for debugging
      setBookings(data || []);
    }
  };

  const isSlotAvailable = useCallback((date: Date, hour: number) => {
    if (!activeSchedule) {
      console.log('No active schedule');
      return false;
    }
    
    const dayOfWeek = date.getDay();
    const daySchedule = activeSchedule[dayOfWeek];
    
    if (!daySchedule || !daySchedule.slots) {
      console.log('No schedule for this day:', dayOfWeek);
      return false;
    }

    const isInSchedule = daySchedule.slots.some((slot: any) => {
      const start = parseInt(slot.start.split(':')[0]);
      const end = parseInt(slot.end.split(':')[0]);
      return hour >= start && hour < end;
    });

    if (!isInSchedule) {
      return false;
    }

    // Check if there's an accepted or pending booking for this slot
    const bookingExists = bookings.some(booking => {
      const bookingStartTime = new Date(booking.start_time);
      const bookingEndTime = new Date(booking.end_time);
      
      // Convert the target date and hour to a comparable time
      const targetTime = new Date(date);
      targetTime.setHours(hour, 0, 0, 0);
      
      // Normalize all times to UTC for comparison
      const targetUTC = Date.UTC(
        targetTime.getFullYear(),
        targetTime.getMonth(),
        targetTime.getDate(),
        hour
      );
      
      const startUTC = Date.UTC(
        bookingStartTime.getUTCFullYear(),
        bookingStartTime.getUTCMonth(),
        bookingStartTime.getUTCDate(),
        bookingStartTime.getUTCHours()
      );
      
      const endUTC = Date.UTC(
        bookingEndTime.getUTCFullYear(),
        bookingEndTime.getUTCMonth(),
        bookingEndTime.getUTCDate(),
        bookingEndTime.getUTCHours()
      );

      const isOverlapping = targetUTC >= startUTC && targetUTC < endUTC;

      console.log('Booking overlap check:', {
        targetTime: new Date(targetUTC).toISOString(),
        bookingStart: new Date(startUTC).toISOString(),
        bookingEnd: new Date(endUTC).toISOString(),
        hour,
        isOverlapping,
        status: booking.status
      });

      return isOverlapping;
    });

    const isAvailable = !bookingExists;
    
    console.log('Final availability:', {
      hour,
      isInSchedule,
      hasBooking: bookingExists,
      isAvailable
    });

    return isAvailable;
  }, [activeSchedule, bookings]);

  const handleBooking = () => {
    if (!selectedDate || selectedHours.length === 0) {
      alert('Please select a date and time for your booking');
      return;
    }

    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(selectedHours[0]), 0, 0, 0);
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(parseInt(selectedHours[selectedHours.length - 1]), 0, 0, 0);

    const queryParams = new URLSearchParams({
      streamerId: streamer.id.toString(),
      streamerName: `${streamer.first_name} ${streamer.last_name}`,
      date: format(startDateTime, 'yyyy-MM-dd'),
      startTime: format(startDateTime, 'HH:mm:ss'),
      endTime: format(endDateTime, 'HH:mm:ss'),
      platform: platform,
      price: streamer.price.toString(),
      location: streamer.location,
      rating: streamer.rating.toString(),
      image_url: streamer.image_url,
    });

    setIsBookingModalOpen(false);
    router.push(`/booking-detail?${queryParams.toString()}`);
  };

  const generateTimeOptions = () => {
    if (!selectedDate || !activeSchedule) return [];
    const dayOfWeek = selectedDate.getDay();
    const daySchedule = activeSchedule[dayOfWeek];
    if (!daySchedule || !daySchedule.slots) return [];
  
    const options = daySchedule.slots.flatMap((slot: { start: string; end: string }) => {
      const start = parseInt(slot.start.split(':')[0]);
      const end = parseInt(slot.end.split(':')[0]);
      return Array.from({ length: end - start }, (_, i) => `${(start + i).toString().padStart(2, '0')}:00`);
    });

    // Filter out hours that are not available
    return options.filter((hour: string) => isSlotAvailable(selectedDate, parseInt(hour)));
  };

  const timeOptions = generateTimeOptions();

  const generateWeekDays = (startDate: Date) => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  const weekDays = generateWeekDays(currentWeekStart);

  const handleHourSelection = (hour: string) => {
    setSelectedHours((prevSelected) => {
      const hourNum = parseInt(hour);
      
      // If clicking on an already selected hour
      if (prevSelected.includes(hour)) {
        const newSelected = prevSelected.filter(h => h !== hour);
        
        // After deselection, ensure remaining hours are continuous
        if (newSelected.length > 0) {
          const selectedHourNums = newSelected.map(h => parseInt(h));
          const minHour = Math.min(...selectedHourNums);
          const maxHour = Math.max(...selectedHourNums);
          
          // Create an array of all hours between min and max
          return Array.from(
            { length: maxHour - minHour + 1 }, 
            (_, i) => `${(minHour + i).toString().padStart(2, '0')}:00`
          );
        }
        return newSelected;
      } else {
        // If no hours are selected yet, just select this hour
        if (prevSelected.length === 0) {
          return [hour];
        }
        
        // Get the first and last selected hours
        const selectedHourNums = prevSelected.map(h => parseInt(h));
        const minHour = Math.min(...selectedHourNums);
        const maxHour = Math.max(...selectedHourNums);
        
        // Only allow selection if it's consecutive (either one hour before first or one hour after last)
        if (hourNum === maxHour + 1 || hourNum === minHour - 1) {
          const newSelected = [...prevSelected, hour];
          // Sort numerically to ensure correct order
          return newSelected.sort((a, b) => parseInt(a) - parseInt(b));
        }
        
        // If clicking a new starting hour, reset selection to just this hour
        return [hour];
      }
    });
  };

  const isHourSelected = (hour: string) => selectedHours.includes(hour);

  const isHourDisabled = (hour: string) => {
    if (!selectedDate) return true;
    
    const hourNum = parseInt(hour);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hourNum, 0, 0, 0);
    const now = new Date();

    // Check if the date is too soon for shipping
    if (isDateTooSoonForShipping(selectedDate)) return true;
    
    // Basic time validation
    if (isBefore(selectedDateTime, now)) return true;
    
    // Check if slot is available in schedule
    if (!isSlotAvailable(selectedDate, hourNum)) return true;
    
    // If no hours selected, all available hours are enabled
    if (selectedHours.length === 0) return false;
    
    // Get the first and last selected hours
    const selectedHourNums = selectedHours.map(h => parseInt(h));
    const minHour = Math.min(...selectedHourNums);
    const maxHour = Math.max(...selectedHourNums);
    
    // Only enable hours that would maintain continuity
    // Either one hour before the first selected hour or one hour after the last selected hour
    return hourNum !== maxHour + 1 && hourNum !== minHour - 1;
  };

  const isDayOff = (date: Date) => {
    return date < startOfDay(new Date()) || 
           daysOff.includes(format(date, 'yyyy-MM-dd')) ||
           isDateTooSoonForShipping(date);
  };

  const getMinimumBookingDate = () => {
    if (needsShipping === 'no') return startOfDay(new Date());
    
    // If shipping is needed, check locations
    const isSameCity = clientLocation.toLowerCase() === streamer.location.toLowerCase();
    const daysToAdd = isSameCity ? 1 : 3;
    return addDays(startOfDay(new Date()), daysToAdd);
  };

  const isDateTooSoonForShipping = (date: Date) => {
    if (needsShipping === 'no') return false;
    return isBefore(date, getMinimumBookingDate());
  };

  const fullName = `${streamer.first_name} ${streamer.last_name}`;
  
  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const getSelectedTimeRange = () => {
    if (selectedHours.length === 0) return '';
    const startTime = selectedHours[0];
    const endTime = selectedHours[selectedHours.length - 1];
    const duration = selectedHours.length - 1;
    return `${startTime} - ${endTime} (${duration} hour${duration !== 1 ? 's' : ''})`;
  };

  const isAvailable = (hour: number) => {
    const timeSlot = hour >= 6 && hour < 12 ? 'morning' :
                     hour >= 12 && hour < 18 ? 'afternoon' :
                     hour >= 18 && hour < 24 ? 'evening' : 'night';
    const day = selectedDate?.getDay();
    const isWeekend = day === 0 || day === 6;
    
    return (
      streamer.availableTimeSlots?.includes(timeSlot) &&
      (isWeekend ? streamer.availableTimeSlots?.includes('weekends') : streamer.availableTimeSlots?.includes('weekdays'))
    );
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isMessageLoading) return;
    setIsMessageLoading(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Start navigation early
      router.prefetch('/messages');

      // Create conversation in parallel with navigation
      const clientId = user.id;
      const streamerId = streamer.id;
      
      createOrGetConversation(clientId, streamerId)
        .catch(error => {
          console.error('Error creating conversation:', error);
          toast.error('Failed to create conversation');
        });

      // Navigate immediately without waiting for conversation creation
      router.push('/messages');
      
    } catch (error) {
      console.error('Error in message flow:', error);
      toast.error('Failed to start conversation');
    } finally {
      setIsMessageLoading(false);
    }
  };

  // Debug the incoming data
  console.log('StreamerCard received data:', {
    streamerId: streamer.id,
    currentPrice: streamer.price,
    previousPrice: streamer.previous_price,
    discountPercentage: streamer.discount_percentage,
    hasDiscount: Boolean(streamer.previous_price && streamer.discount_percentage)
  });

  const priceInfo = formatDiscount(
    streamer.price,
    streamer.previous_price,
    streamer.discount_percentage
  );

  // Debug the price info result
  console.log('Price info result:', priceInfo);

  return (
    <>
      <div 
        className="group relative bg-transparent w-full font-sans cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        onClick={() => setIsProfileModalOpen(true)}
        onMouseEnter={handleCardHover}
      >
        {/* Image Container with Location Overlay */}
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-[#f0f0ef]">
          <img
            src={streamer.image_url}
            alt={formatName(streamer.first_name, streamer.last_name)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Location overlay */}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#2563eb]" />
            <span className="text-xs font-medium text-gray-700">{streamer.location}</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 pt-3 bg-[#faf9f6]">
          {/* Name and Platforms */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-gray-900">
                {formatName(streamer.first_name, streamer.last_name)}
              </h3>
              <div className="flex gap-1">
                {(streamer.platforms || [streamer.platform]).map((platform, index) => (
                  <div
                    key={platform}
                    className={`px-2 py-0.5 rounded-full text-white text-[10px] font-medium
                      ${platform.toLowerCase() === 'shopee' 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                        : 'bg-gradient-to-r from-blue-900 to-black text-white'
                      }`}
                  >
                    {platform}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Price Display */}
          <div className="flex flex-col mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-gray-900">
                {priceInfo.displayPrice}
              </span>
              <span className="text-xs font-normal text-gray-500">/ jam</span>
            </div>
            {priceInfo.originalPrice && priceInfo.discountPercentage && priceInfo.discountPercentage > 0 && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-gray-400 line-through">
                  {priceInfo.originalPrice}
                </span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Hemat {priceInfo.discountPercentage}%
                </span>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="mb-3">
            <RatingStars rating={averageRating} />
          </div>

          {/* Bio Preview */}
          <div className="h-[48px] mb-4">
            <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
              {streamer.bio || 'Belum ada deskripsi tersedia'}
              {streamer.bio && streamer.bio.length > 100 && (
                <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer ml-1 inline-block">
                  Read more
                </span>
              )}
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(streamer.category || '')
              .split(',')
              .filter(Boolean)
              .slice(0, 3)
              .map((category) => (
              <div 
                key={category} 
                className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1.5 rounded-lg border border-[#f0f0ef]"
              >
                <div className="p-1 bg-[#2563eb]/10 rounded-full">
                  <Monitor className="w-3 h-3 text-[#2563eb]" />
                </div>
                <span className="text-xs text-gray-600 truncate">
                  {category.trim()}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div 
            className="flex gap-2" 
            onClick={(e) => e.stopPropagation()}
          >
            <Button 
              className="flex-1 text-xs py-2 text-white max-w-[85%] 
                bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] hover:to-[#581c87]
                transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                openBookingModal();
              }}
            >
              Book Livestreamer
            </Button>
            <Button
              variant="outline"
              className="px-2.5 text-[#2563eb] border-[#2563eb] hover:bg-[#2563eb]/5 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(false);
                handleMessageClick(e);
              }}
              disabled={isMessageLoading}
            >
              {isMessageLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-3 sm:p-6 animate-none">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src={streamer.image_url}
                alt={`${streamer.first_name} ${streamer.last_name}`}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-semibold mb-0.5">
                  {formatName(streamer.first_name, streamer.last_name)}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">

                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <BookingCalendar 
            selectedDate={selectedDate}
            onDateSelect={(dateStr) => setSelectedDate(new Date(dateStr))}
            onTimeSelect={(time) => {
              if (selectedDate) {
                const [hours, minutes] = time.split(':').map(Number);
                const newDate = new Date(selectedDate);
                newDate.setHours(hours, minutes, 0, 0);
                setSelectedDate(newDate);
              }
            }}
          />

          <div className="h-px bg-gray-200" />

          {activeSchedule ? (
            <div className="space-y-3 sm:space-y-4">
              {(['Morning', 'Afternoon', 'Evening', 'Night'] as const).map((timeOfDay) => {
                const slots = getTimeSlots(timeOfDay);
                const availableSlots = slots.filter(hour => 
                  Array.isArray(timeOptions) && 
                  timeOptions.some(option => isTimeOption(option) && option === hour)
                );
                
                // Only show the section if there are available slots
                if (availableSlots.length === 0) return null;

                return (
                  <div key={timeOfDay}>
                    <h4 className="text-xs sm:text-sm font-semibold mb-2">{timeOfDay}</h4>
                    <div className="grid grid-cols-6 gap-1 sm:gap-2">
                      {slots.map((hour) => {
                        const isAvailable = Array.isArray(timeOptions) && 
                          timeOptions.some(option => isTimeOption(option) && option === hour);

                        return (
                          <Button
                            key={hour}
                            variant={isHourSelected(hour) ? "default" : "outline"}
                            className={cn(
                              "text-[10px] sm:text-sm p-1 sm:p-2 h-auto",
                              isHourSelected(hour) 
                                ? 'bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white hover:from-[#1e3a8a] hover:to-[#581c87]' 
                                : 'hover:bg-blue-50',
                              !isAvailable && 'opacity-50 cursor-not-allowed'
                            )}
                            onClick={() => handleHourSelection(hour)}
                            disabled={isHourDisabled(hour) || !isAvailable}
                          >
                            {hour}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-sm text-gray-500 mb-2">
                This streamer hasn't set their availability yet.
              </div>
              <div className="text-xs text-gray-400">
                Please check back later or contact the streamer directly.
              </div>
            </div>
          )}

          {selectedHours.length > 0 && (
            <div className="text-xs sm:text-sm font-medium">
              Selected time: {getSelectedTimeRange()}
            </div>
          )}
          {selectedHours.length === 1 && (
            <p className="text-xs text-red-500">Minimum booking is 1 hour.</p>
          )}

          <div className="h-px bg-gray-200 my-4" />

          {/* Grid container for both selects */}
          <div className="space-y-4">
            {/* Shipping Select */}
            <div className="grid grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="shipping-needed" className="text-right text-xs sm:text-sm">
                Perlu Pengiriman
              </Label>
              <Select
                value={needsShipping}
                onValueChange={(value) => setNeedsShipping(value as ShippingOption)}
              >
                <SelectTrigger id="shipping-needed" className="col-span-3 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Pilih opsi pengiriman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Ya</SelectItem>
                  <SelectItem value="no">Tidak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipping information message */}
            {needsShipping === 'yes' && (
              <div className="col-span-4 text-sm bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800">
                  {clientLocation.toLowerCase() === streamer.location.toLowerCase()
                    ? "Karena lokasi Anda sama dengan streamer, Anda hanya dapat memilih jadwal minimal H+1 untuk memberikan waktu pengiriman produk."
                    : "Karena lokasi Anda berbeda dengan streamer, Anda hanya dapat memilih jadwal minimal H+3 untuk memberikan waktu pengiriman produk."
                  }
                </p>
                <p className="text-blue-600 mt-2 text-xs">
                  Lokasi Anda: {clientLocation || 'Belum diatur'}
                  <br />
                  Lokasi Streamer: {streamer.location}
                </p>
              </div>
            )}

            {/* Platform Select */}
            <div className="grid grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="booking-platform" className="text-right text-xs sm:text-sm">
                Platform
              </Label>
              <Select onValueChange={setPlatform} value={platform}>
                <SelectTrigger id="booking-platform" className="col-span-3 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shopee">Shopee</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add the customer support text */}
          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm">
              <span className="text-gray-600">Ada pertanyaan? Hubungi CS kami: </span>
              <a 
                href="https://wa.me/6282154902561" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 underline hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                klik disini
              </a>
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button 
              onClick={handleBooking} 
              className="w-full h-10 sm:h-12 text-xs sm:text-sm bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] hover:to-[#581c87] text-white"
              disabled={selectedHours.length < 2}
            >
              Proceed to Booking Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <Dialog
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
        >
          <DialogContent 
            className="max-w-2xl w-full h-[85vh] overflow-y-auto z-[100] fixed inset-0 top-[55%] left-[50%] translate-x-[-50%] translate-y-[-50%] p-6"
          >
            <DialogHeader className="bg-white pb-4">
              <DialogTitle>Streamer Profile</DialogTitle>
              <DialogDescription>
                View detailed information about this streamer
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingProfile ? (
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            ) : extendedProfile ? (
              <>
                {/* Professional ID Card Layout */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Left Column - Photo and Basic Info */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                        <Image
                          src={streamer.image_url}
                          alt={formatName(streamer.first_name, streamer.last_name)}
                          fill
                          className="rounded-lg object-cover border-2 border-white shadow-md"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">
                          {extendedProfile.rating ? `${Number(extendedProfile.rating).toFixed(1)} / 5.0` : 'Not rated yet'}
                        </span>
                      </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="flex-1 space-y-4">
                      {/* Name and Title */}
                      <div className="border-b border-blue-200 pb-3">
                        <h2 className="text-xl font-semibold text-blue-900">
                          {formatName(streamer.first_name, streamer.last_name)}
                        </h2>
                        <p className="text-sm text-blue-600 font-medium">Professional Livestreamer</p>
                      </div>

                      {/* Info Grid - Redesigned for better desktop view */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                        {/* Age */}
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 rounded-md">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Age</p>
                            <p className="text-sm">{extendedProfile.age ? `${extendedProfile.age} Years` : 'Not specified'}</p>
                          </div>
                        </div>

                        {/* Gender */}
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 rounded-md">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Gender</p>
                            <p className="text-sm">{extendedProfile.gender || 'Not specified'}</p>
                          </div>
                        </div>

                        {/* Experience */}
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 rounded-md">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Experience</p>
                            <p className="text-sm">{extendedProfile.experience || 'Not specified'}</p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 rounded-md">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Location</p>
                            <p className="text-sm">{extendedProfile.location || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Platform Tags */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {(streamer.platforms || [streamer.platform]).map((platform) => (
                          <div
                            key={platform}
                            className={`px-3 py-1 rounded-full text-white text-xs font-medium
                              ${platform.toLowerCase() === 'shopee' 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                          >
                            {platform}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">About Me</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {extendedProfile.fullBio || extendedProfile.bio || 'Belum ada deskripsi tersedia'}
                  </p>
                </div>

                {/* Video Section */}
                {extendedProfile.video_url && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Featured Content</h3>
                    <div className="w-full aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(extendedProfile.video_url) || ''}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Gallery Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Gallery</h3>
                  {isLoadingGallery ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="aspect-square bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : extendedProfile?.gallery?.photos && extendedProfile.gallery.photos.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {extendedProfile.gallery.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square relative overflow-hidden rounded-lg shadow-sm"
                        >
                          <Image
                            src={photo.photo_url}
                            alt={`Gallery photo ${photo.order_number}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 600px) 25vw, 150px"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">No gallery photos available</p>
                  )}
                </div>

                {/* Testimonials Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Client Testimonials</h3>
                  {isLoadingTestimonials ? (
                    <div className="space-y-4">
                      {[1, 2].map((n) => (
                        <div key={n} className="h-20 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : extendedProfile.testimonials?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {extendedProfile.testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  className={cn(
                                    "w-3 h-3",
                                    testimonial.rating >= star 
                                      ? "text-yellow-400 fill-yellow-400" 
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-blue-600">
                              {testimonial.client_name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 italic">"{testimonial.comment}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">No testimonials yet</p>
                  )}
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function StreamerCardSkeleton() {
  return (
    <div className="group relative bg-transparent w-full font-sans cursor-pointer">
      <div className="relative w-full aspect-square sm:aspect-[4/5] rounded-xl overflow-hidden bg-gray-200 animate-pulse"></div>
      <div className="p-3 sm:p-4 pt-2 sm:pt-3 bg-white/95 rounded-b-xl">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="flex flex-col mb-1.5">
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
        </div>
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );
}