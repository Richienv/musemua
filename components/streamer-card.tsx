import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Star, StarHalf, MapPin, ChevronLeft, ChevronRight, User, Calendar, Clock, Monitor, DollarSign, X, Mail, Sun, Sunset, Moon, Info, Package } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "./ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { useTouchGestures } from '@/lib/hooks/use-touch-gestures';

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

// Add TimeRange interface at the top with other interfaces
interface TimeRange {
  start: string;
  end: string;
  duration: number;
}

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

// Update the formatPrice function to use adjusted price
function formatPrice(price: number): string {
  const adjustedPrice = price * 1.3; // Add 30% to base price
  if (adjustedPrice < 1000) {
    return `Rp ${Math.round(adjustedPrice)}/hour`;
  }
  const firstTwoDigits = Math.floor(adjustedPrice / 1000);
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

// Add new interface for selected date info
interface SelectedDateInfo {
  date: Date;
  hours: string[];
  totalHours: number;
  isEditing: boolean;
  timeRanges?: { start: string; end: string; duration: number }[];
}

const calculateBlockDuration = (block: string[]): number => {
  if (block.length === 0) return 0;
  const startHour = parseInt(block[0]);
  const endHour = parseInt(block[block.length - 1]);
  // Calculate duration based on the actual time difference
  return endHour - startHour + 1; // Add 1 because the end hour is inclusive
};

const getBulkDateRange = (mode: 'week' | 'twoWeeks' | 'month', startDate: Date = new Date()) => {
  const start = startOfDay(startDate);
  switch (mode) {
    case 'week':
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    case 'twoWeeks':
      return Array.from({ length: 14 }, (_, i) => addDays(start, i));
    case 'month':
      return Array.from({ length: 30 }, (_, i) => addDays(start, i));
  }
};

const getTotalHoursAndPrice = (selectedDates: Map<string, SelectedDateInfo>, basePrice: number) => {
  let totalHours = 0;
  let totalPrice = 0;

  selectedDates.forEach((dateInfo) => {
    // Group consecutive hours into blocks
    const blocks: string[][] = [];
    let currentBlock: string[] = [dateInfo.hours[0]];
    
    for (let i = 1; i < dateInfo.hours.length; i++) {
      if (parseInt(dateInfo.hours[i]) === parseInt(dateInfo.hours[i - 1]) + 1) {
        currentBlock.push(dateInfo.hours[i]);
      } else {
        blocks.push([...currentBlock]);
        currentBlock = [dateInfo.hours[i]];
      }
    }
    blocks.push(currentBlock);

    // Calculate hours for each block based on actual time difference
    blocks.forEach(block => {
      if (block.length > 0) {
        const startHour = parseInt(block[0]);
        const endHour = parseInt(block[block.length - 1]);
        // Calculate duration by subtracting 1 from the difference to get actual hours
        const duration = endHour - startHour + 1 - 1; // +1 for inclusive, -1 for actual hours
        totalHours += duration;
        totalPrice += duration * basePrice;
      }
    });
  });

  return { totalHours, totalPrice };
};

const validateTimeSlotSelection = (
  currentHours: string[],
  newHour: string,
  dateKey: string,
  selectedDates: Map<string, SelectedDateInfo>,
  isRemoving: boolean = false,
  isSlotAvailable: (date: Date, hour: number) => boolean
): { isValid: boolean; error: string } => {
  // Convert hours to numbers for easier comparison
  const hourNum = parseInt(newHour);
  const selectedHourNums = currentHours.map(h => parseInt(h));

  // If removing an hour
  if (isRemoving) {
    // First, remove the hour we want to remove
    const remainingHours = selectedHourNums.filter(h => h !== hourNum);
    if (remainingHours.length === 0) return { isValid: true, error: "" };

    // Group remaining hours into consecutive blocks
    const blocks: number[][] = [];
    let currentBlock: number[] = [remainingHours[0]];

    for (let i = 1; i < remainingHours.length; i++) {
      if (remainingHours[i] === remainingHours[i - 1] + 1) {
        currentBlock.push(remainingHours[i]);
      } else {
        blocks.push([...currentBlock]);
        currentBlock = [remainingHours[i]];
      }
    }
    blocks.push(currentBlock);

    // Check if all resulting blocks maintain the minimum 3-slot requirement
    const hasValidBlocks = blocks.every(block => {
      const duration = (Math.max(...block) - Math.min(...block)) + 1; // Add 1 for inclusive duration
      return duration >= 3;
    });

    if (!hasValidBlocks) {
      return {
        isValid: false,
        error: "Tidak dapat menghapus jam karena akan membuat durasi kurang dari 2 jam (3 slot)"
      };
    }

    return { isValid: true, error: "" };
  }

  // If adding a new hour
  // If no hours selected, always valid to start
  if (selectedHourNums.length === 0) {
    // When starting a new block, we need to ensure there are at least 2 more available hours after this one
    const nextTwoHours = [hourNum + 1, hourNum + 2];
    const dateInfo = selectedDates.get(dateKey);
    
    if (!dateInfo) return { isValid: false, error: "Invalid date" };
    
    const allHoursAvailable = nextTwoHours.every(h => 
      isSlotAvailable(new Date(dateInfo.date), h)
    );

    if (!allHoursAvailable) {
      return {
        isValid: false,
        error: "Harus tersedia minimal 2 jam berurutan setelah jam yang dipilih (total 3 slot)"
      };
    }

    return { isValid: true, error: "" };
  }

  // Group existing hours into blocks
  const blocks: number[][] = [];
  let currentBlock: number[] = [selectedHourNums[0]];

  for (let i = 1; i < selectedHourNums.length; i++) {
    if (selectedHourNums[i] === selectedHourNums[i - 1] + 1) {
      currentBlock.push(selectedHourNums[i]);
    } else {
      blocks.push([...currentBlock]);
      currentBlock = [selectedHourNums[i]];
    }
  }
  blocks.push(currentBlock);

  // Check if the new hour extends any existing block
  for (const block of blocks) {
    const minHour = Math.min(...block);
    const maxHour = Math.max(...block);

    if (hourNum === maxHour + 1 || hourNum === minHour - 1) {
      // When extending a block, ensure it doesn't exceed maximum allowed duration
      const newBlockSize = hourNum === maxHour + 1 ? block.length + 1 : block.length + 1;
      return { isValid: true, error: "" };
    }
  }

  // If starting a new block, ensure there's at least a 2-hour gap
  const minGap = Math.min(...blocks.map(block => {
    const blockMin = Math.min(...block);
    const blockMax = Math.max(...block);
    return Math.min(
      Math.abs(hourNum - blockMin),
      Math.abs(hourNum - blockMax)
    );
  }));

  if (minGap >= 2) {
    // When starting a new block, we need to ensure there are at least 2 more available hours after this one
    const nextTwoHours = [hourNum + 1, hourNum + 2];
    const dateInfo = selectedDates.get(dateKey);
    
    if (!dateInfo) return { isValid: false, error: "Invalid date" };
    
    const allHoursAvailable = nextTwoHours.every(h => 
      isSlotAvailable(new Date(dateInfo.date), h)
    );

    if (!allHoursAvailable) {
      return {
        isValid: false,
        error: "Harus tersedia minimal 2 jam berurutan setelah jam yang dipilih (total 3 slot)"
      };
    }

    return { isValid: true, error: "" };
  }

  return {
    isValid: false,
    error: "Mohon pilih jam yang berurutan atau berjarak minimal 2 jam dari jadwal lain"
  };
};

const validateMinimumBooking = (hours: string[]): { isValid: boolean; error: string } => {
  // Group consecutive hours into blocks
  const blocks: string[][] = [];
  let currentBlock: string[] = [hours[0]];

  for (let i = 1; i < hours.length; i++) {
    if (parseInt(hours[i]) === parseInt(hours[i - 1]) + 1) {
      currentBlock.push(hours[i]);
    } else {
      blocks.push([...currentBlock]);
      currentBlock = [hours[i]];
    }
  }
  blocks.push(currentBlock);

  // Check if any block meets the minimum requirement (3 slots = 2 hours)
  const hasValidBlock = blocks.some(block => block.length >= 3);
  
  if (!hasValidBlock) {
    return {
      isValid: false,
      error: "Setiap sesi pemesanan harus minimal 2 jam berurutan (3 slot waktu)"
    };
  }

  return { isValid: true, error: "" };
};

// Add new validation function for shipping and date restrictions
const validateDateRestrictions = (
  date: Date,
  needsShipping: ShippingOption,
  clientLocation: string,
  streamerLocation: string
): { isValid: boolean; error: string } => {
  const now = new Date();
  const startOfTomorrow = startOfDay(addDays(now, 1));

  // Basic validation - can't book today or in the past
  if (isBefore(date, startOfTomorrow)) {
    return {
      isValid: false,
      error: "Pemesanan hanya dapat dilakukan mulai besok"
    };
  }

  // Shipping validation
  if (needsShipping === 'yes') {
    const isSameCity = clientLocation.toLowerCase() === streamerLocation.toLowerCase();
    const minDays = isSameCity ? 1 : 3;
    const earliestDate = addDays(startOfTomorrow, minDays - 1);

    if (isBefore(date, earliestDate)) {
      return {
        isValid: false,
        error: isSameCity
          ? "Untuk pengiriman produk, pemesanan dapat dilakukan mulai besok untuk memastikan pengiriman produk"
          : "Untuk pengiriman produk ke luar kota, pemesanan dapat dilakukan minimal 3 hari dari sekarang untuk memastikan pengiriman produk"
      };
    }
  }

  return { isValid: true, error: "" };
};

// Add this helper function for bulk selection validation
const validateBulkSelection = (
  dates: Date[],
  needsShipping: ShippingOption | null,
  clientLocation: string,
  streamerLocation: string
): { 
  validDates: Date[],
  invalidDates: { date: Date; reason: string }[]
} => {
  // Return early if required fields are not set
  if (!needsShipping) {
    return {
      validDates: [],
      invalidDates: dates.map(date => ({
        date,
        reason: "Shipping requirement not selected"
      }))
    };
  }

  const result = {
    validDates: [] as Date[],
    invalidDates: [] as { date: Date; reason: string }[]
  };

  for (const date of dates) {
    const dateValidation = validateDateRestrictions(
      date,
      needsShipping,
      clientLocation,
      streamerLocation
    );

    if (dateValidation.isValid) {
      result.validDates.push(date);
    } else {
      result.invalidDates.push({
        date,
        reason: dateValidation.error
      });
    }
  }

  return result;
};

// Add this validation helper at the top level
const validateRequirementsForDateSelection = (
  needsShipping: ShippingOption | null,
  platform: string | null
): { isValid: boolean; error: string } => {
  if (!needsShipping) {
    return {
      isValid: false,
      error: "Mohon pilih opsi pengiriman terlebih dahulu"
    };
  }
  if (!platform) {
    return {
      isValid: false,
      error: "Mohon pilih platform streaming terlebih dahulu"
    };
  }
  return { isValid: true, error: "" };
};

// Add helper function to group consecutive hours into time ranges
const groupConsecutiveHours = (hours: string[]): TimeRange[] => {
  if (!hours.length) return [];
  
  const sortedHours = [...hours].sort();
  const ranges: TimeRange[] = [];
  let currentRange: { start: string; end: string } | null = null;

  for (let i = 0; i < sortedHours.length; i++) {
    const currentHour = parseInt(sortedHours[i]);
    const nextHour = i < sortedHours.length - 1 ? parseInt(sortedHours[i + 1]) : null;

    if (!currentRange) {
      currentRange = {
        start: `${currentHour.toString().padStart(2, '0')}:00`,
        end: `${(currentHour + 1).toString().padStart(2, '0')}:00`
      };
    } else if (nextHour === currentHour + 1) {
      currentRange.end = `${(currentHour + 1).toString().padStart(2, '0')}:00`;
    } else {
      ranges.push({
        start: currentRange.start,
        end: currentRange.end,
        duration: parseInt(currentRange.end) - parseInt(currentRange.start)
      });
      currentRange = null;
    }
  }

  if (currentRange) {
    ranges.push({
      start: currentRange.start,
      end: currentRange.end,
      duration: parseInt(currentRange.end) - parseInt(currentRange.start)
    });
  }

  return ranges;
};

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

  // Add new state for multi-day selection
  const [selectedDates, setSelectedDates] = useState<Map<string, SelectedDateInfo>>(new Map());
  
  // Keep existing states for backward compatibility during transition
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string | null>(null);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [needsShipping, setNeedsShipping] = useState<ShippingOption | null>(null);
  const [clientLocation, setClientLocation] = useState<string>('');

  // Add new state for active bulk selection mode
  const [activeBulkMode, setActiveBulkMode] = useState<'week' | 'twoWeeks' | 'month' | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  // Inside the StreamerCard component, add this state near other state declarations:
  const [isRequirementsValid, setIsRequirementsValid] = useState(() => 
    validateRequirementsForDateSelection(needsShipping, platform)
  );

  // Add this effect to update the requirements validation when dependencies change
  useEffect(() => {
    setIsRequirementsValid(validateRequirementsForDateSelection(needsShipping, platform));
  }, [needsShipping, platform]);

  const isMinimumBookingMet = useCallback(() => {
    if (selectedDates.size === 0) return false;

    return Array.from(selectedDates.values()).some(dateInfo => {
      // Group consecutive hours into blocks
      const blocks: string[][] = [];
      let currentBlock: string[] = [dateInfo.hours[0]];

      for (let i = 1; i < dateInfo.hours.length; i++) {
        if (parseInt(dateInfo.hours[i]) === parseInt(dateInfo.hours[i - 1]) + 1) {
          currentBlock.push(dateInfo.hours[i]);
        } else {
          blocks.push([...currentBlock]);
          currentBlock = [dateInfo.hours[i]];
        }
      }
      blocks.push(currentBlock);

      // Check if any block meets the minimum requirement
      return blocks.some(block => block.length >= 2);
    });
  }, [selectedDates]);

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
      return hour >= start && hour <= end;  // Changed to <= to include end hour
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

  // Update handleDateSelect to include required fields validation
  const handleDateSelect = (date: Date) => {
    // Validate required fields first
    const requiredFieldsValidation = validateRequirementsForDateSelection(needsShipping, platform);
    if (!requiredFieldsValidation.isValid) {
      toast.error(requiredFieldsValidation.error, {
        duration: 4000,
        position: 'top-center',
        className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg px-4 py-3 rounded-xl',
        icon: '⚠️',
      });
      return;
    }

    // Rest of the validation...
    const dateValidation = validateDateRestrictions(
      date,
      needsShipping as ShippingOption,
      clientLocation,
      streamer.location
    );

    if (!dateValidation.isValid) {
      toast.error(dateValidation.error, {
        duration: 4000,
        position: 'top-center',
        className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg px-4 py-3 rounded-xl',
      });
      return;
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    
    setSelectedDates(prev => {
      const next = new Map(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        // Get available hours for this date
        const daySchedule = activeSchedule?.[date.getDay()];
        const availableHours: string[] = [];
        
        if (daySchedule?.slots) {
          daySchedule.slots.forEach((slot: any) => {
            const startHour = parseInt(slot.start);
            const endHour = parseInt(slot.end);
            
            for (let hour = startHour; hour <= endHour; hour++) {
              const hourString = `${hour.toString().padStart(2, '0')}:00`;
              if (isSlotAvailable(date, hour)) {
                availableHours.push(hourString);
              }
            }
          });

          // Sort hours but don't limit them
          const sortedHours = availableHours.sort((a, b) => parseInt(a) - parseInt(b));

          if (sortedHours.length > 0) {
            // Calculate actual hours based on time difference
            const startHour = parseInt(sortedHours[0]);
            const endHour = parseInt(sortedHours[sortedHours.length - 1]);
            const actualHours = endHour - startHour + 1 - 1; // +1 for inclusive, -1 for actual hours

            next.set(dateKey, {
              date,
              hours: sortedHours,
              totalHours: actualHours,
              isEditing: false
            });
          }
        }
      }
      return next;
    });
  };

  // Update handleBooking to handle multi-day bookings
  const handleBooking = () => {
    if (!selectedDates.size) return;

    const bookingsData = Array.from(selectedDates.entries()).map(([dateKey, dateInfo]) => {
      // Group consecutive hours into time ranges
      const timeRanges = groupConsecutiveHours(dateInfo.hours.sort());
      
      return {
        date: dateKey,
        timeRanges,
        // Keep these for backward compatibility
        startTime: timeRanges[0].start,
        endTime: timeRanges[timeRanges.length - 1].end,
        hours: timeRanges.reduce((total, range) => total + range.duration, 0)
      };
    });

    // Calculate total hours across all bookings and time ranges
    const totalHours = bookingsData.reduce((total, booking) => 
      total + booking.timeRanges.reduce((rangeTotal, range) => rangeTotal + range.duration, 0), 0
    );

    const params = new URLSearchParams({
      streamerId: streamer.id.toString(),
      streamerName: formatName(streamer.first_name, streamer.last_name),
      platform: platform || streamer.platform,
      price: streamer.price.toString(),
      totalHours: totalHours.toString(),
      totalPrice: (streamer.price * totalHours).toString(),
      location: streamer.location,
      rating: streamer.rating.toString(),
      image_url: streamer.image_url,
      bookings: JSON.stringify(bookingsData)
    });

    router.push(`/booking-detail?${params.toString()}`);
  };

  const generateTimeOptions = () => {
    if (!selectedDate || !activeSchedule) return [];
    const dayOfWeek = selectedDate.getDay();
    const daySchedule = activeSchedule[dayOfWeek];
    if (!daySchedule || !daySchedule.slots) return [];
  
    const options = daySchedule.slots.flatMap((slot: { start: string; end: string }) => {
      const start = parseInt(slot.start.split(':')[0]);
      const end = parseInt(slot.end.split(':')[0]);
      // Changed length calculation to include the end hour
      return Array.from({ length: end - start + 1 }, (_, i) => `${(start + i).toString().padStart(2, '0')}:00`);
    });

    // Filter out hours that are not available
    return options.filter((hour: string) => isSlotAvailable(selectedDate, parseInt(hour)));
  };

  const timeOptions = generateTimeOptions();

  const generateWeekDays = (startDate: Date) => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  const weekDays = generateWeekDays(currentWeekStart);

  const isHourSelected = (hour: string) => selectedHours.includes(hour);

  const isHourDisabled = (hour: string, dateKey: string) => {
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
    
    // Get current date's selected hours
    const dateInfo = selectedDates.get(dateKey);
    if (!dateInfo || dateInfo.hours.length === 0) return false;
    
    // Get the first and last selected hours for this date
    const selectedHourNums = dateInfo.hours.map(h => parseInt(h));
    const minHour = Math.min(...selectedHourNums);
    const maxHour = Math.max(...selectedHourNums);
    
    // Only enable hours that would maintain continuity
    return hourNum !== maxHour + 1 && hourNum !== minHour - 1;
  };

  const isDayOff = (date: Date) => {
    return date < startOfDay(new Date()) || 
           daysOff.includes(format(date, 'yyyy-MM-dd')) ||
           isDateTooSoonForShipping(date);
  };

  const getMinimumBookingDate = () => {
    const startOfTomorrow = startOfDay(addDays(new Date(), 1));
    
    if (needsShipping === 'no') return startOfTomorrow;
    
    // If shipping is needed, check locations
    const isSameCity = clientLocation.toLowerCase() === streamer.location.toLowerCase();
    const daysToAdd = isSameCity ? 0 : 2; // Subtract 1 from previous values since we're starting from tomorrow
    return addDays(startOfTomorrow, daysToAdd);
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

  // Update the bulk selection click handler
  const handleBulkSelection = async (mode: 'week' | 'twoWeeks' | 'month') => {
    if (!isRequirementsValid.isValid) {
      toast.error(isRequirementsValid.error, {
        duration: 4000,
        position: 'top-center',
        className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg px-4 py-3 rounded-xl',
        icon: '⚠️',
      });
      return;
    }

    setActiveBulkMode(mode);
    const dates = getBulkDateRange(mode);
    
    // Validate all dates first
    const { validDates, invalidDates } = validateBulkSelection(
      dates,
      needsShipping as ShippingOption,
      clientLocation,
      streamer.location
    );

    if (validDates.length === 0) {
      toast.error("Tidak ada tanggal yang tersedia untuk pemilihan", {
        duration: 4000,
        position: 'top-center',
        className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg px-4 py-3 rounded-xl',
        icon: '⚠️',
      });
      setActiveBulkMode(null);
      return;
    }

    // Show warning if some dates were invalid
    if (invalidDates.length > 0) {
      toast.error(`${invalidDates.length} tanggal dilewati karena pembatasan waktu`, {
        duration: 4000,
        position: 'top-center',
        className: 'bg-white text-yellow-600 border-2 border-yellow-100 shadow-lg px-4 py-3 rounded-xl',
        icon: '⚠️',
      });
    }

    const newSelectedDates = new Map<string, SelectedDateInfo>();
    
    // Process each valid date
    for (const date of validDates) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const daySchedule = activeSchedule?.[date.getDay()];
      
      if (daySchedule?.slots) {
        // Collect all available hours from all slots
        const availableHours: string[] = [];
        daySchedule.slots.forEach((slot: any) => {
          const startHour = parseInt(slot.start);
          const endHour = parseInt(slot.end);
          
          for (let hour = startHour; hour <= endHour; hour++) {  // Changed to <= to include end hour
            const hourString = `${hour.toString().padStart(2, '0')}:00`;
            if (isSlotAvailable(date, hour)) {
              availableHours.push(hourString);
            }
          }
        });
        
        // Only add dates with available hours
        if (availableHours.length > 0) {
          newSelectedDates.set(dateKey, {
            date,
            hours: availableHours.sort(),
            totalHours: availableHours.length,
            isEditing: false
          });
        }
      }
    }

    // Update state only if we found available slots
    if (newSelectedDates.size > 0) {
      setSelectedDates(newSelectedDates);
      setIsSummaryExpanded(true);
      
      // Show success message with summary
      toast.success(
        `Berhasil memilih ${newSelectedDates.size} hari dengan total ${Array.from(newSelectedDates.values()).reduce((total, date) => total + date.totalHours, 0)} jam`, {
          duration: 4000,
          position: 'top-center',
          className: 'bg-white text-green-600 border-2 border-green-100 shadow-lg px-4 py-3 rounded-xl',
          icon: '✓',
        }
      );
    } else {
      toast.error("Tidak ada slot waktu yang tersedia untuk periode yang dipilih", {
        duration: 4000,
        position: 'top-center',
        className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg px-4 py-3 rounded-xl',
        icon: '⚠️',
      });
      setActiveBulkMode(null);
    }
  };

  const handleTimeSlotSelect = (dateKey: string, hour: string) => {
    setSelectedDates(prev => {
      const next = new Map(prev);
      const dateInfo = next.get(dateKey);
      
      if (!dateInfo) return next;

      let newHours = [...(dateInfo.hours || [])];
      const hourNum = parseInt(hour);
      
      // If hour is already selected, handle removal
      if (newHours.includes(hour)) {
        // Validate removal with the new isRemoving parameter
        const validation = validateTimeSlotSelection(newHours, hour, dateKey, next, true, isSlotAvailable);
        if (!validation.isValid) {
          toast.error(validation.error, {
            duration: 3000,
            position: 'top-center',
            className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg',
          });
          return prev;
        }
        newHours = newHours.filter(h => h !== hour);
      } else {
        // When adding a new hour
        if (newHours.length === 0) {
          // If this is the first hour, automatically add three consecutive hours (2-hour duration)
          const nextHours = [
            hour,
            `${(hourNum + 1).toString().padStart(2, '0')}:00`,
            `${(hourNum + 2).toString().padStart(2, '0')}:00`
          ];
          
          // Validate that all hours are available
          const allHoursAvailable = nextHours.every(h => {
            const hourNum = parseInt(h);
            return isSlotAvailable(new Date(dateInfo.date), hourNum);
          });

          if (!allHoursAvailable) {
            toast.error("Tidak dapat memilih jam ini karena durasi 2 jam berikutnya tidak tersedia (total 3 slot)", {
              duration: 3000,
              position: 'top-center',
              className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg',
            });
            return prev;
          }

          newHours = nextHours;
        } else {
          // For existing blocks, validate and add the hour
          const validation = validateTimeSlotSelection(newHours, hour, dateKey, next, false, isSlotAvailable);
          if (!validation.isValid) {
            toast.error(validation.error, {
              duration: 3000,
              position: 'top-center',
              className: 'bg-white text-red-600 border-2 border-red-100 shadow-lg',
            });
            return prev;
          }
          
          newHours = [...newHours, hour].sort((a, b) => parseInt(a) - parseInt(b));
        }
      }

      if (newHours.length === 0) {
        next.delete(dateKey);
        return next;
      }

      // Group consecutive hours into blocks
      const blocks: string[][] = [];
      let currentBlock: string[] = [newHours[0]];
      
      for (let i = 1; i < newHours.length; i++) {
        if (parseInt(newHours[i]) === parseInt(newHours[i - 1]) + 1) {
          currentBlock.push(newHours[i]);
        } else {
          blocks.push([...currentBlock]);
          currentBlock = [newHours[i]];
        }
      }
      blocks.push(currentBlock);

      // Calculate total hours based on actual time differences
      const totalHours = blocks.reduce((total, block) => {
        if (block.length === 0) return total;
        const startHour = parseInt(block[0]);
        const endHour = parseInt(block[block.length - 1]);
        return total + (endHour - startHour); // Remove the +1 to get actual duration
      }, 0);

      // Update the date info with new hours and formatted time ranges
      next.set(dateKey, {
        ...dateInfo,
        hours: newHours,
        totalHours,
        timeRanges: blocks.map(block => {
          const startHour = parseInt(block[0]);
          const endHour = parseInt(block[block.length - 1]);
          return {
            start: block[0],
            end: `${(endHour).toString().padStart(2, '0')}:00`,
            duration: endHour - startHour // Remove the +1 to get actual duration
          };
        })
      });

      return next;
    });
  };

  // Add a new function to check schedule availability
  const hasAvailableSchedule = useCallback((date: Date) => {
    if (!activeSchedule) return false;
    
    const dayOfWeek = date.getDay();
    const daySchedule = activeSchedule[dayOfWeek];
    
    if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) {
      return false;
    }

    // Check if there are any available hours in the schedule
    for (const slot of daySchedule.slots) {
      const startHour = parseInt(slot.start);
      const endHour = parseInt(slot.end);
      
      for (let hour = startHour; hour < endHour; hour++) {
        if (isSlotAvailable(date, hour)) {
          return true;
        }
      }
    }

    return false;
  }, [activeSchedule, isSlotAvailable]);

  // Add intersection observer
  const { ref: cardRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Add touch gestures
  const touchRef = useTouchGestures({
    onSwipe: (direction) => {
      if (direction === 'left') {
        setIsBookingModalOpen(true);
      } else if (direction === 'right') {
        setIsProfileModalOpen(true);
      }
    },
    onLongPress: () => {
      setIsProfileModalOpen(true);
    },
  });

  // Merge refs
  const setRefs = (element: HTMLDivElement | null) => {
    cardRef.current = element;
    touchRef.current = element;
  };

  return (
    <div 
      ref={setRefs}
      className={cn(
        "relative rounded-lg overflow-hidden bg-white shadow-lg",
        "gpu-accelerated touch-optimized",
        "hover:shadow-xl transition-shadow duration-normal ease-smooth",
        "active:scale-[0.98] transition-transform duration-instant",
        "dark:bg-gray-800",
        isIntersecting ? "animate-card-entrance" : "opacity-0 translate-y-4"
      )}
      onClick={() => setIsProfileModalOpen(true)}
      onMouseEnter={handleCardHover}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={streamer.image_url}
          alt={`${streamer.first_name} ${streamer.last_name}`}
          fill
          className={cn(
            "object-cover w-full h-full",
            "transition-transform duration-normal ease-out",
            "group-hover:scale-105"
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "text-lg font-semibold",
            "transition-colors duration-fast ease-out"
          )}>
            {formatName(streamer.first_name, streamer.last_name)}
          </h3>
          <RatingStars rating={streamer.rating} />
        </div>

        {/* Price section with optimized animations */}
        <div className={cn(
          "mt-2 flex items-center gap-2",
          "animate-response content-optimized"
        )}>
          <span className="text-xl font-bold text-primary">
            {formatPrice(streamer.price)}
          </span>
          {streamer.previous_price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(streamer.previous_price)}
            </span>
          )}
        </div>

        {/* Platform badges with optimized animations */}
        <div className="mt-3 flex flex-wrap gap-2">
          {streamer.platforms?.map((platform) => (
            <span
              key={platform}
              className={cn(
                "px-2 py-1 text-xs rounded-full",
                "transition-all duration-fast ease-out",
                "hover:scale-105 active:scale-95",
                "gpu-accelerated"
              )}
            >
              {platform}
            </span>
          ))}
        </div>
      </div>

      {/* Booking button with optimized animations */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleBooking();
        }}
        className={cn(
          "mt-4 w-full py-3 px-4",
          "bg-primary text-white font-semibold",
          "transition-all duration-fast ease-out",
          "hover:bg-primary-dark",
          "active:scale-[0.98]",
          "gpu-accelerated touch-optimized"
        )}
      >
        Book Now
      </button>
    </div>
  );
}

export function StreamerCardSkeleton() {
  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden bg-white shadow-lg",
      "animate-pulse content-optimized"
    )}>
      <div className="relative aspect-[4/3] bg-gray-200" />
      <div className="p-4">
        <div className="h-6 w-2/3 bg-gray-200 rounded" />
        <div className="mt-2 h-8 w-1/3 bg-gray-200 rounded" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}