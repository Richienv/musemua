import { useState, useEffect, useCallback } from 'react';
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

// Update the Streamer interface to include video_url
export interface Streamer {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  platform: string;
  category: string;
  rating: number;
  price: number;
  image_url: string;
  bio: string;
  location: string;
  video_url: string | null;
  availableTimeSlots?: string[];
}

// Update the StreamerProfile interface
interface StreamerProfile extends Streamer {
  age: number;
  gender: string;
  experience: string;
  fullBio: string;
  gallery: {
    photos: { id: number; photo_url: string; order_number: number }[];
  };
  testimonials: {
    client_name: string; // Change this from clientName to client_name
    comment: string;
  }[];
}

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

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const router = useRouter();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [extendedProfile, setExtendedProfile] = useState<StreamerProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [platform, setPlatform] = useState(streamer.platform);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [bookings, setBookings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(streamer.rating);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isMinimumBookingMet = selectedHours.length >= 2;

  useEffect(() => {
    fetchExtendedProfile();

    const supabase = createClient();
    
    const ratingSubscription = supabase
      .channel('public:streamer_ratings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'streamer_ratings', filter: `streamer_id=eq.${streamer.id}` },
        () => {
          fetchExtendedProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ratingSubscription);
    };
  }, [streamer.id]);

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
    if (extendedProfile && extendedProfile.gallery.photos.length > 0) {
      setSelectedImage(extendedProfile.gallery.photos[0].photo_url);
    }
  }, [extendedProfile]);

  const fetchExtendedProfile = async () => {
    const supabase = createClient();
    
    // Fetch streamer data including video_url
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('*')
      .eq('id', streamer.id)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer data:', streamerError);
    }

    // Fetch average rating
    const { data: ratingData, error: ratingError } = await supabase
      .rpc('get_streamer_average_rating', { streamer_id_param: streamer.id });

    if (ratingError) {
      console.error('Error fetching average rating:', ratingError);
    } else if (ratingData !== null) {
      setAverageRating(parseFloat(ratingData));
    }

    // Fetch gallery photos
    const { data: galleryPhotos, error: galleryError } = await supabase
      .from('streamer_gallery_photos')
      .select('*')
      .eq('streamer_id', streamer.id)
      .order('order_number');

    if (galleryError) {
      console.error('Error fetching gallery photos:', galleryError);
    }

    // Fetch testimonials
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('streamer_id', streamer.id);

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
    }

    console.log("Fetched video_url:", streamerData?.video_url);

    setExtendedProfile({
      ...streamer,
      ...streamerData,
      rating: ratingData ? parseFloat(ratingData) : streamer.rating,
      age: 28, // You might want to fetch this from the database as well
      gender: "Female", // You might want to fetch this from the database as well
      experience: "5 years", // You might want to fetch this from the database as well
      fullBio: streamerData?.bio || streamer.bio,
      gallery: {
        photos: galleryPhotos || [],
      },
      testimonials: testimonials || [],
    });

    console.log("Extended Profile:", {
      ...streamer,
      ...streamerData,
      rating: ratingData ? parseFloat(ratingData) : streamer.rating,
      gallery: { photos: galleryPhotos || [] },
      testimonials: testimonials || [],
    });
  };

  const fetchActiveSchedule = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('streamer_active_schedules')
      .select('schedule')
      .eq('streamer_id', streamer.id);

    if (error) {
      console.error('Error fetching active schedule:', error);
    } else if (data && data.length > 0) {
      setActiveSchedule(JSON.parse(data[0].schedule));
    } else {
      // Set a default schedule if none is found
      setActiveSchedule({
        0: { slots: [{ start: '09:00', end: '17:00' }] },
        1: { slots: [{ start: '09:00', end: '17:00' }] },
        2: { slots: [{ start: '09:00', end: '17:00' }] },
        3: { slots: [{ start: '09:00', end: '17:00' }] },
        4: { slots: [{ start: '09:00', end: '17:00' }] },
        5: { slots: [{ start: '09:00', end: '17:00' }] },
        6: { slots: [{ start: '09:00', end: '17:00' }] },
      });
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
    if (!activeSchedule) return false;
    const dayOfWeek = date.getDay();
    const daySchedule = activeSchedule[dayOfWeek];
    if (!daySchedule || !daySchedule.slots) return false;
  
    const isInSchedule = daySchedule.slots.some((slot: any) => {
      const start = parseInt(slot.start.split(':')[0]);
      const end = parseInt(slot.end.split(':')[0]);
      return hour >= start && hour < end;
    });

    // Check if there's an accepted or pending booking for this slot
    const bookingExists = bookings.some(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return (
        isSameDay(date, bookingStart) &&
        (
          (hour >= bookingStart.getHours() && hour < bookingEnd.getHours()) ||
          (hour === bookingEnd.getHours() && bookingEnd.getMinutes() > 0)
        )
      );
    });

    return isInSchedule && !bookingExists;
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
      if (prevSelected.includes(hour)) {
        return prevSelected.filter((h) => h !== hour);
      } else {
        const newSelected = [...prevSelected, hour].sort();
        if (newSelected.length > 1) {
          const start = newSelected[0];
          const end = newSelected[newSelected.length - 1];
          return Array.from({ length: parseInt(end) - parseInt(start) + 1 }, (_, i) => 
            `${(parseInt(start) + i).toString().padStart(2, '0')}:00`
          );
        }
        return newSelected;
      }
    });
  };

  const isHourSelected = (hour: string) => selectedHours.includes(hour);

  const isHourDisabled = (hour: string) => {
    if (!selectedDate) return true;
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(parseInt(hour), 0, 0, 0);
    const now = new Date();
    return isBefore(selectedDateTime, now) || !isSlotAvailable(selectedDate, parseInt(hour));
  };

  const isDayOff = (date: Date) => daysOff.includes(format(date, 'yyyy-MM-dd'));

  const fullName = `${streamer.first_name} ${streamer.last_name}`;
  
  const openBookingModal = () => {
    if (!selectedDate) {
      setSelectedDate(startOfDay(new Date()));
    }
    setIsBookingModalOpen(true);
  };

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

  const handleMessageClick = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to send messages');
        router.push('/sign-in');
        return;
      }

      // user.id is already string (UUID) from auth
      const clientId = user.id;
      // streamer.id is number (BigInt) from database
      const streamerId = streamer.id;

      await createOrGetConversation(clientId, streamerId);
      router.push('/messages');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  return (
    <>
      <div 
        className="group relative bg-transparent w-full max-w-xs font-sans cursor-pointer"
        onClick={() => setIsProfileModalOpen(true)}
      >
        {/* Image Container with hover effect */}
        <div className="relative w-full h-48 rounded-xl overflow-hidden">
          <img
            src={streamer.image_url}
            alt={fullName}
            className="w-full h-full object-cover transform transition-transform duration-300 scale-100 group-hover:scale-105"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5" />
        </div>

        {/* Content Container with floating effect */}
        <div className="mt-2 p-4 bg-white/95 rounded-xl 
          transition-all duration-300 group-hover:bg-white">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base text-foreground">{fullName}</h3>
            <div className={`px-2 py-0.5 rounded-full text-white text-[10px] font-medium
              ${streamer.platform.toLowerCase() === 'shopee' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_0_5px_rgba(249,115,22,0.5)] hover:shadow-[0_0_8px_rgba(249,115,22,0.6)]' 
                : 'bg-gradient-to-r from-purple-800 to-purple-900 shadow-[0_0_5px_rgba(88,28,135,0.5)] hover:shadow-[0_0_8px_rgba(88,28,135,0.6)]'
              } transition-all duration-300`}>
              {streamer.platform}
            </div>
          </div>

          <div className="flex items-center text-[10px] text-foreground/70 mb-2">
            <span>{streamer.category}</span>
            <span className="mx-1">|</span>
            <MapPin className="w-2 h-2 mr-0.5 inline" />
            <span>{streamer.location}</span>
          </div>

          <RatingStars rating={averageRating} />

          <div className="mt-3 flex flex-col space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold text-foreground">
                Rp {streamer.price.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-foreground/70 ml-1">/ jam</span>
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                className={`flex-1 text-xs py-1 text-white
                  ${streamer.platform.toLowerCase() === 'shopee' 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' 
                    : 'bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  openBookingModal();
                }}
              >
                Book Livestreamer
              </Button>
              <Button
                variant="outline"
                className="px-3 text-red-500 border-red-500 hover:bg-red-50 hover:text-red-500 hover:border-red-500"
                onClick={handleMessageClick}
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center space-x-4 mb-6">
              <Image
                src={streamer.image_url}
                alt={`${streamer.first_name} ${streamer.last_name}`}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
              <div>
                <DialogTitle className="text-2xl font-semibold mb-1">{streamer.first_name} {streamer.last_name}</DialogTitle>
                <DialogDescription className="text-base">Select your preferred date and time</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 text-base">
            <div className="flex justify-between items-center">
              <ChevronLeft 
                className="w-6 h-6 text-gray-600 cursor-pointer hover:text-red-500 transition-colors" 
                onClick={handlePreviousWeek}
              />
              <span className="text-lg font-medium">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d')}
              </span>
              <ChevronRight 
                className="w-6 h-6 text-gray-600 cursor-pointer hover:text-red-500 transition-colors" 
                onClick={handleNextWeek}
              />
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <Button
                  key={day.toISOString()}
                  variant={isSameDay(day, selectedDate || new Date()) ? "default" : "ghost"}
                  className={`p-2 h-auto flex flex-col ${
                    isSameDay(day, selectedDate || new Date())
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'hover:bg-red-50'
                  }`}
                  onClick={() => setSelectedDate(day)}
                  disabled={day < startOfDay(new Date()) || isDayOff(day)}
                >
                  <span className="text-sm">{format(day, 'EEE')}</span>
                  <span className="text-lg font-bold">{format(day, 'd')}</span>
                </Button>
              ))}
            </div>

            <div className="h-px bg-gray-200" />

            {timeOptions.length > 0 ? (
              <div className="space-y-4">
                {['Morning', 'Afternoon', 'Evening', 'Night'].map((timeOfDay) => (
                  <div key={timeOfDay}>
                    <h4 className="text-base font-semibold mb-2">{timeOfDay}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {timeOptions
                        .filter((hour: string) => {
                          const hourNum = parseInt(hour.split(':')[0]);
                          return (
                            (timeOfDay === 'Night' && (hourNum >= 0 && hourNum < 6)) ||
                            (timeOfDay === 'Morning' && (hourNum >= 6 && hourNum < 12)) ||
                            (timeOfDay === 'Afternoon' && (hourNum >= 12 && hourNum < 18)) ||
                            (timeOfDay === 'Evening' && (hourNum >= 18 && hourNum < 24))
                          );
                        })
                        .map((hour: string) => (
                          <Button
                            key={hour}
                            variant={isHourSelected(hour) ? "default" : "outline"}
                            className={`text-base p-2 h-auto ${
                              isHourSelected(hour) 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'hover:bg-red-50'
                            }`}
                            onClick={() => handleHourSelection(hour)}
                            disabled={isHourDisabled(hour)}
                          >
                            {hour}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-lg">No available slots for this day</div>
            )}

            {selectedHours.length > 0 && (
              <div className="text-base font-medium">
                Selected time: {getSelectedTimeRange()}
              </div>
            )}
            {selectedHours.length === 1 && (
              <p className="text-red-500 text-base">Minimum booking is 1 hour.</p>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="booking-platform" className="text-right text-base">Platform</Label>
              <Select onValueChange={setPlatform} value={platform}>
                <SelectTrigger id="booking-platform" className="col-span-3 h-10 text-base">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shopee">Shopee</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleBooking} 
              className="w-full h-12 text-base bg-red-500 hover:bg-red-600 text-white"
              disabled={selectedHours.length < 2}
            >
              Proceed to Booking Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto border-2 border-red-500 p-6">
          <DialogClose className="absolute right-4 top-4 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors z-50">
            <X className="h-4 w-4" />
          </DialogClose>
          
          <style jsx global>{`
            .dialog-close-button {
              display: none;
            }
          `}</style>
          
          {extendedProfile && (
            <>
              {/* Video Section - Only once at the top */}
              {extendedProfile.video_url && (
                <div className="mb-6">
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(extendedProfile.video_url) || ''}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-2 border-red-500"
                  ></iframe>
                </div>
              )}

              <hr className="border-t border-red-200 mb-6" />

              {/* Profile Info Section */}
              <div className="flex gap-6">
                {/* Left side - Image with red border */}
                <Image
                  src={extendedProfile.image_url}
                  alt={fullName}
                  width={100}
                  height={100}
                  className="object-cover border-2 border-red-500"
                />
                
                {/* Right side - Info */}
                <div className="flex-1">
                  <div className="mb-3">
                    <h2 className="text-xl font-bold">{fullName}</h2>
                    <p className="text-sm text-foreground/70">{extendedProfile.category}</p>
                    <div className="mt-1">
                      <RatingStars rating={averageRating} />
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2 text-red-500">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{extendedProfile.age} Years</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{extendedProfile.gender}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{extendedProfile.experience}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{extendedProfile.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of the content */}
              <div className="space-y-6 text-sm font-sans mt-6">
                {/* About Me */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-500">About Me</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{extendedProfile.fullBio}</p>
                </div>

                {/* Gallery */}
                <div>
                  <h3 className="text-sm font-semibold text-red-500 mb-3">Gallery</h3>
                  <div className="flex space-x-4">
                    {/* Main Image */}
                    <div className="relative w-2/3 h-64">
                      <Image
                        src={selectedImage || extendedProfile.image_url}
                        alt="Selected gallery image"
                        layout="fill"
                        objectFit="cover"
                        className="border border-red-500"
                      />
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="w-1/3 grid grid-cols-2 gap-2 overflow-y-auto max-h-64">
                      {extendedProfile.gallery.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className={`relative w-full pt-[100%] cursor-pointer overflow-hidden 
                            ${selectedImage === photo.photo_url ? 'ring-2 ring-red-500' : ''}`}
                          onClick={() => setSelectedImage(photo.photo_url)}
                        >
                          <Image
                            src={photo.photo_url}
                            alt={`Gallery photo ${photo.order_number}`}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="border-t border-gray-200" />

                {/* Testimonials */}
                <div>
                  <h3 className="text-sm font-semibold text-red-500 mb-3">Client Testimonials</h3>
                  <div className="space-y-3">
                    {extendedProfile.testimonials.map((testimonial, index) => (
                      <div key={index} className="border border-red-500 p-3 rounded-lg">
                        <p className="italic text-gray-600">"{testimonial.comment}"</p>
                        <p className="font-medium mt-1 text-red-500">- {testimonial.client_name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button 
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      openBookingModal();
                    }}
                  >
                    Book Livestreamer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}