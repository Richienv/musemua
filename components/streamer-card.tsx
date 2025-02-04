import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Star, StarHalf, MapPin, ChevronLeft, ChevronRight, User, Calendar, Clock, Monitor, DollarSign, X, Mail, Sun, Sunset, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { createClient } from "@/utils/supabase/client";
import { format, addDays, startOfWeek, addWeeks, isSameDay, endOfWeek, isAfter, isBefore, startOfDay, subWeeks, addHours, parseISO, differenceInHours, parse } from 'date-fns';
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
        <DialogContent className="max-w-[680px] p-0 overflow-hidden rounded-2xl bg-white max-h-[85vh] flex flex-col fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] booking-dialog-mobile">
          {/* Hero Section with Streamer Info - Fixed height */}
          <div className="relative h-48 flex-shrink-0">
            {/* Background Image with Gradient */}
            <div className="absolute inset-0">
              <Image
                src={streamer.image_url}
                alt={formatName(streamer.first_name, streamer.last_name)}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
            </div>

            {/* Close Button */}
            <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
              <X className="h-4 w-4 text-white" />
            </DialogClose>

            {/* Streamer Info */}
            <div className="absolute bottom-0 w-full p-6">
              <div className="flex items-end gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 backdrop-blur-sm">
                  <Image
                    src={streamer.image_url}
                    alt={formatName(streamer.first_name, streamer.last_name)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 mb-1">
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {formatName(streamer.first_name, streamer.last_name)}
                  </h2>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{streamer.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{streamer.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Content - Make this section scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Step 1: Basic Requirements */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Basic Requirements</h3>
                    <p className="text-xs text-gray-500">Set up your booking preferences</p>
                  </div>
                </div>
                
                {/* Shipping Option */}
                <div className="ml-8 space-y-3">
                  <div className="space-y-2">
                    <Label 
                      htmlFor="shipping-needed" 
                      className={cn(
                        "text-sm font-medium",
                        needsShipping ? "text-blue-700" : "text-gray-900"
                      )}
                    >
                      Do you need to ship products?
                    </Label>
                    <p className="text-xs text-gray-500">
                      For physical product reviews and unboxing
                    </p>
                    <Select
                      value={needsShipping}
                      onValueChange={(value) => setNeedsShipping(value as ShippingOption)}
                    >
                      <SelectTrigger 
                        id="shipping-needed" 
                        className={cn(
                          "w-full bg-white border-gray-200 h-11",
                          needsShipping && "border-blue-200 ring-1 ring-blue-100"
                        )}
                      >
                        <SelectValue placeholder="Select shipping requirement" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom" 
                        align="start" 
                        sideOffset={8}
                        className="z-[9999]"
                      >
                        <SelectItem value="yes" className="py-2.5">
                          <div>
                            <div className="font-medium">Yes, I'll ship products</div>
                            <div className="text-xs text-gray-500">For product reviews and unboxing content</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="no" className="py-2.5">
                          <div>
                            <div className="font-medium">No shipping needed</div>
                            <div className="text-xs text-gray-500">For digital products or services only</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {needsShipping === 'yes' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-sm text-blue-800">
                        {clientLocation.toLowerCase() === streamer.location.toLowerCase()
                          ? "Since you're in the same city, booking starts from tomorrow to allow time for delivery."
                          : "Since you're in a different city, booking starts from 3 days later for delivery time."
                        }
                      </p>
                    </div>
                  )}

                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label 
                      htmlFor="booking-platform" 
                      className={cn(
                        "text-sm font-medium",
                        platform ? "text-blue-700" : "text-gray-900"
                      )}
                    >
                      Where do you want to stream?
                    </Label>
                    <p className="text-xs text-gray-500">
                      Choose your preferred streaming platform
                    </p>
                    <Select 
                      onValueChange={setPlatform} 
                      value={platform}
                    >
                      <SelectTrigger 
                        id="booking-platform" 
                        className={cn(
                          "w-full bg-white border-gray-200 h-11",
                          platform && "border-blue-200 ring-1 ring-blue-100"
                        )}
                      >
                        <SelectValue placeholder="Choose streaming platform" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom" 
                        align="start" 
                        sideOffset={8}
                        className="z-[9999]"
                      >
                        <SelectItem value="Shopee" className="py-2.5">
                          <div>
                            <div className="font-medium">Shopee Live</div>
                            <div className="text-xs text-gray-500">Ideal for product sales with direct purchase links</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="TikTok" className="py-2.5">
                          <div>
                            <div className="font-medium">TikTok Live</div>
                            <div className="text-xs text-gray-500">Perfect for reaching a broader audience</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Step 2: Select Date */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Select Date</h3>
                    <p className="text-xs text-gray-500">Choose your preferred streaming date</p>
                  </div>
                </div>

                <div className="ml-8 space-y-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousWeek}
                      disabled={isBefore(startOfWeek(currentWeekStart), startOfWeek(new Date()))}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextWeek}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((date) => {
                      const isSelected = selectedDate && isSameDay(date, selectedDate);
                      const isDisabled = isDayOff(date);

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => !isDisabled && setSelectedDate(date)}
                          disabled={isDisabled}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-xl transition-all",
                            isSelected
                              ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-200"
                              : "hover:bg-blue-50",
                            isDisabled && "opacity-50 cursor-not-allowed bg-gray-50"
                          )}
                        >
                          <span className="text-xs font-medium mb-1">
                            {format(date, 'EEE')}
                          </span>
                          <span className="text-lg font-semibold">
                            {format(date, 'd')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 3: Select Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Select Time</h3>
                    <p className="text-xs text-gray-500">Choose your preferred time slots (minimum 2 hours)</p>
                  </div>
                </div>

                <div className="ml-8">
                  {activeSchedule ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-end">
                        {selectedHours.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedHours([])}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear Selection
                          </Button>
                        )}
                      </div>

                      {/* Time Selection */}
                      {(['Morning', 'Afternoon', 'Evening', 'Night'] as const).map((timeOfDay) => {
                        const slots = getTimeSlots(timeOfDay);
                        const availableSlots = slots.filter(hour => {
                          if (!selectedDate) return false;
                          const hourNum = parseInt(hour);
                          return isSlotAvailable(selectedDate, hourNum);
                        });

                        if (availableSlots.length === 0) return null;

                        return (
                          <div key={timeOfDay} className="space-y-3">
                            <div className="flex items-center gap-2">
                              {timeOfDay === 'Morning' && <Sun className="h-4 w-4 text-amber-500" />}
                              {timeOfDay === 'Afternoon' && <Sun className="h-4 w-4 text-orange-500" />}
                              {timeOfDay === 'Evening' && <Sunset className="h-4 w-4 text-indigo-500" />}
                              {timeOfDay === 'Night' && <Moon className="h-4 w-4 text-blue-500" />}
                              <h4 className="text-sm font-medium text-gray-700">{timeOfDay}</h4>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {availableSlots.map((hour) => {
                                const isSelected = selectedHours.includes(hour);
                                const isEndpoint = hour === selectedHours[0] || hour === selectedHours[selectedHours.length - 1];
                                const isMiddle = isSelected && !isEndpoint;
                                const disabled = isMiddle || isHourDisabled(hour);

                                return (
                                  <button
                                    key={hour}
                                    onClick={() => !disabled && handleHourSelection(hour)}
                                    disabled={disabled}
                                    className={cn(
                                      "relative h-12 rounded-xl border transition-all duration-200",
                                      isSelected
                                        ? "bg-blue-50 border-blue-200 shadow-sm"
                                        : "border-gray-200 hover:border-blue-300",
                                      isMiddle && "cursor-not-allowed opacity-50",
                                      !isSelected && !disabled && "hover:bg-blue-50",
                                      disabled && "cursor-not-allowed opacity-50"
                                    )}
                                  >
                                    <time className="text-sm font-medium">
                                      {format(parse(hour, 'HH:mm', new Date()), 'h:mm a')}
                                    </time>
                                    {isEndpoint && (
                                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-100 rounded-full">
                                        <span className="text-[10px] font-medium text-blue-700">
                                          {hour === selectedHours[0] ? 'Start' : 'End'}
                                        </span>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Show "No Available Time" message if no slots are available for the selected date */}
                      {selectedDate && !(['Morning', 'Afternoon', 'Evening', 'Night'] as const).some(timeOfDay => {
                        const slots = getTimeSlots(timeOfDay);
                        return slots.some(hour => isSlotAvailable(selectedDate, parseInt(hour)));
                      }) && (
                        <div className="text-center py-4 px-3">
                          <div className="max-w-[140px] mx-auto mb-3">
                            <Image
                              src="/images/no-streamer-found.png"
                              alt="No time slots available"
                              width={140}
                              height={140}
                              className="w-full h-auto"
                            />
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            No Available Time Slots
                          </h4>
                          <p className="text-xs text-gray-500 mb-2">
                            This streamer doesn't have any available slots for the selected date. 
                            Try selecting a different date to find available time slots.
                          </p>
                        </div>
                      )}

                      {/* Selected Time Summary */}
                      {selectedHours.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium text-blue-900">Selected Time Range</h4>
                              <p className="text-lg font-semibold text-blue-700">
                                {format(parse(selectedHours[0], 'HH:mm', new Date()), 'h:mm a')} - 
                                {format(parse(selectedHours[selectedHours.length - 1], 'HH:mm', new Date()), 'h:mm a')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-blue-900">Duration</p>
                              <p className="text-lg font-semibold text-blue-700">
                                {selectedHours.length - 1} hours
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 px-3">
                      <div className="max-w-[140px] mx-auto mb-3">
                        <Image
                          src="/images/no-streamer-found.png"
                          alt="No schedule available"
                          width={140}
                          height={140}
                          className="w-full h-auto"
                        />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        No Schedule Available
                      </h4>
                      <p className="text-xs text-gray-500">
                        This streamer hasn't set their availability yet.
                        Please check back later or try contacting them directly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Proceed Button - Fixed at bottom */}
          <div className="p-6 border-t border-gray-100 bg-white flex-shrink-0">
            <Button
              onClick={handleBooking}
              disabled={!isMinimumBookingMet || !platform}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium"
            >
              {!platform
                ? 'Please select a platform'
                : !isMinimumBookingMet
                ? 'Select at least 2 hours'
                : 'Proceed to Booking Details'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <Dialog
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
        >
          <DialogContent 
            className="max-w-2xl w-full h-[85vh] overflow-y-auto z-[9999] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] p-6 dialog-content-mobile"
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

                {/* Featured Content */}
                {extendedProfile.video_url && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900">Featured Content</h3>
                    <div className="relative w-full max-w-[360px] mx-auto">
                      <div className="relative pb-[177.78%]">  {/* 9:16 aspect ratio */}
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(extendedProfile.video_url) || ''}`}
                          className="absolute inset-0 w-full h-full rounded-xl"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gallery Section */}
                <div className="mb-8">
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