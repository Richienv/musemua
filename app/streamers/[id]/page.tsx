"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, MapPin, Star, Info, StarHalf, X, Check, Package, Clock, Monitor } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import type { Streamer } from '@/components/streamer-card';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addDays, startOfDay, isBefore, addWeeks, subWeeks } from 'date-fns';
import { BookingCalendar } from '@/components/booking-calendar';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GalleryPhoto {
  id: number;
  photo_url: string;
  order_number: number;
}

type ShippingOption = 'yes' | 'no';

interface Testimonial {
  client_name: string;
  comment: string;
  rating: number;
}

interface ExtendedStreamerProfile extends Streamer {
  gallery: {
    photos: GalleryPhoto[];
  };
  testimonials: Testimonial[];
  fullBio: string;
}

interface SelectedDateInfo {
  date: Date;
  hours: string[];
  totalHours?: number;
  isEditing?: boolean;
  timeRanges?: Array<{
    start: string;
    end: string;
    duration: number;
  }>;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  slots: TimeSlot[];
}

interface Schedule {
  [key: number]: DaySchedule;
}

function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle youtu.be URLs
  const shortUrlRegex = /youtu\.be\/([a-zA-Z0-9_-]+)/;
  const shortMatch = url.match(shortUrlRegex);
  if (shortMatch) {
    return shortMatch[1];
  }

  // Handle youtube.com URLs
  const standardRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)([^#\&\?]*)/;
  const match = url.match(standardRegex);
  if (match && match[1].length === 11) {
    return match[1];
  }

  return null;
}

export default function StreamerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<ExtendedStreamerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<Map<string, any>>(new Map());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [needsShipping, setNeedsShipping] = useState<'yes' | 'no'>('no');
  const [clientLocation, setClientLocation] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);

  const validateRequirementsForDateSelection = (shipping: 'yes' | 'no' | null, selectedPlatform: string | null): boolean => {
    if (!shipping) {
      return false;
    }
    if (shipping === 'yes' && !clientLocation) {
      return false;
    }
    if (!selectedPlatform) {
      return false;
    }
    return true;
  };

  const [isRequirementsValid, setIsRequirementsValid] = useState(() => 
    validateRequirementsForDateSelection(needsShipping, platform)
  );

  useEffect(() => {
    setIsRequirementsValid(validateRequirementsForDateSelection(needsShipping, platform));
  }, [needsShipping, platform]);

  const isMinimumBookingMet = () => {
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
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
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
          .eq('id', params.id)
          .single();

        if (profileError) throw profileError;

        // Fetch gallery photos
        const { data: galleryData, error: galleryError } = await supabase
          .from('streamer_gallery_photos')
          .select('*')
          .eq('streamer_id', params.id)
          .order('order_number', { ascending: true });

        if (galleryError) throw galleryError;

        // Fetch testimonials
        const { data: testimonialData, error: testimonialError } = await supabase
          .from('testimonials')
          .select('*')
          .eq('streamer_id', params.id);

        if (testimonialError) throw testimonialError;

        const extendedProfileData: ExtendedStreamerProfile = {
          ...profileData,
          gallery: { photos: galleryData || [] },
          testimonials: testimonialData || [],
          fullBio: profileData.bio,
          platforms: profileData.platform ? [profileData.platform] : [],
          categories: profileData.category ? [profileData.category] : [],
          availableTimeSlots: [],
          discount_percentage: null,
          previous_price: null,
          last_price_update: undefined,
          price_history: []
        };

        setProfile(extendedProfileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingGallery(false);
        setIsLoadingTestimonials(false);
      }
    };

    fetchProfile();
  }, [params.id]);

  const openBookingModal = () => {
    // Prefetch schedule and bookings before opening modal
    Promise.all([
      fetchActiveSchedule(),
      fetchAcceptedBookings()
    ]).then(() => {
      setIsBookingModalOpen(true);
    });
  };

  const fetchActiveSchedule = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('streamer_active_schedules')
      .select('schedule')
      .eq('streamer_id', params.id);

    if (error) {
      console.error('Error fetching active schedule:', error);
      setActiveSchedule(null);
    } else if (data && data.length > 0) {
      try {
        const schedule = typeof data[0].schedule === 'string' 
          ? JSON.parse(data[0].schedule)
          : data[0].schedule;
        setActiveSchedule(schedule);
      } catch (e) {
        console.error('Error parsing schedule:', e);
        setActiveSchedule(null);
      }
    } else {
      setActiveSchedule(null);
    }
  };

  const fetchAcceptedBookings = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('streamer_id', params.id)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching accepted bookings:', error);
    } else {
      setAcceptedBookings(data || []);
    }
  };

  const groupConsecutiveHours = (hours: string[]): { start: string; end: string; duration: number }[] => {
    if (!hours.length) return [];

    const ranges: { start: string; end: string; duration: number }[] = [];
    let rangeStart = hours[0];
    let prevHour = parseInt(hours[0]);

    for (let i = 1; i <= hours.length; i++) {
      const currentHour = i < hours.length ? parseInt(hours[i]) : -1;
      if (currentHour !== prevHour + 1) {
        ranges.push({
          start: rangeStart,
          end: hours[i - 1],
          duration: parseInt(hours[i - 1]) - parseInt(rangeStart) + 1
        });
        if (i < hours.length) {
          rangeStart = hours[i];
        }
      }
      prevHour = currentHour;
    }

    return ranges;
  };

  const handleBooking = () => {
    if (!selectedDates.size) return;

    const bookingsData = Array.from(selectedDates.entries()).map(([dateKey, dateInfo]) => {
      // Group consecutive hours into time ranges
      const timeRanges = groupConsecutiveHours(dateInfo.hours.sort());
      
      return {
        date: dateKey,
        timeRanges,
        startTime: timeRanges[0].start,
        endTime: timeRanges[timeRanges.length - 1].end,
        hours: timeRanges.reduce((total, range) => total + range.duration, 0)
      };
    });

    const totalHours = bookingsData.reduce((total, booking) => 
      total + booking.timeRanges.reduce((rangeTotal, range) => rangeTotal + range.duration, 0), 0
    );

    if (!profile) return;

    const params = new URLSearchParams({
      streamerId: profile.id.toString(),
      streamerName: formatName(profile.first_name, profile.last_name),
      platform: platform || profile.platform,
      price: profile.price.toString(),
      totalHours: totalHours.toString(),
      totalPrice: (profile.price * totalHours).toString(),
      location: profile.location,
      rating: profile.rating.toString(),
      image_url: profile.image_url,
      bookings: JSON.stringify(bookingsData)
    });

    router.push(`/booking-detail?${params.toString()}`);
  };

  const createOrGetConversation = async (clientId: string, streamerId: number) => {
    const supabase = createClient();
    
    // Check for existing conversation
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .or(`client_id.eq.${clientId},streamer_id.eq.${streamerId}`)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation if none exists
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        streamer_id: streamerId,
        last_message: null,
        last_message_time: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return newConversation.id;
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isMessageLoading || !profile) return;
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
      const streamerId = profile.id;
      
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotSelect = (dateKey: string, hour: string) => {
    setSelectedDates(prev => {
      const next = new Map(prev);
      next.set(dateKey, { date: new Date(dateKey), hours: [hour] });
      return next;
    });
  };

  const hasAvailableSchedule = (date: Date): boolean => {
    const daySchedule = activeSchedule?.[date.getDay()];
    return daySchedule?.slots && daySchedule.slots.length > 0;
  };

  const isSlotAvailable = (date: Date, hour: number): boolean => {
    const daySchedule = activeSchedule?.[date.getDay()];
    return daySchedule?.slots.some((slot: any) => {
      const start = parseInt(slot.start);
      const end = parseInt(slot.end);
      return start <= hour && hour <= end;
    }) || false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] p-4">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto mt-16">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Streamer not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50">
        <div className="max-w-[1440px] mx-auto px-4 h-full flex items-center">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-[1440px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start gap-6">
                <div 
                  className="relative w-[120px] h-[120px] rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setIsBookingModalOpen(true)}
                >
                  <Image
                    src={profile.image_url || '/images/default-avatar.png'}
                    alt={formatName(profile.first_name, profile.last_name)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h1 
                    className="text-3xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    {formatName(profile.first_name, profile.last_name)}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.experience || '5'} years of experience | Professional Livestreamer
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">
                        {profile.rating ? Number(profile.rating).toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <span>•</span>
                    <span>{profile.location}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(profile.platforms || [profile.platform]).map((platform: string) => (
                      <div
                        key={platform}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          platform.toLowerCase() === 'shopee'
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {platform}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {profile.testimonials?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Reviews</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {profile.gallery?.photos?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Gallery Photos</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {profile.experience ? '5+' : '0'}
                </div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
            </div>

            {/* About Section */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About me</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {profile.fullBio || profile.bio || 'No description available'}
                </p>
              </div>
            </section>

            {/* Experience & Categories */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-6">
                  {profile.experience && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Background</h3>
                      <p className="text-sm text-gray-600">{profile.experience}</p>
                    </div>
                  )}
                  
                  {profile.categories && profile.categories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.categories.map((category: string) => (
                          <span
                            key={category}
                            className="px-2.5 py-1 bg-white text-gray-700 text-xs font-medium rounded-md border border-gray-200"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
                <span className="text-sm text-gray-500">
                  {profile.testimonials?.length || 0} total
                </span>
              </div>
              {profile.testimonials && profile.testimonials.length > 0 ? (
                <div className="space-y-4">
                  {profile.testimonials.map((testimonial: Testimonial, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-medium text-gray-900 mb-1">
                            {testimonial.client_name}
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-4 h-4",
                                  testimonial.rating >= star
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600">"{testimonial.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No reviews yet</div>
              )}
            </section>

            {/* Gallery Section */}
            {profile.gallery?.photos && profile.gallery.photos.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gallery</h2>
                  <span className="text-sm text-gray-500">
                    {profile.gallery.photos.length} photos
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.gallery.photos.map((photo: GalleryPhoto) => (
                    <div 
                      key={photo.id} 
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                    >
                      <Image
                        src={photo.photo_url}
                        alt="Gallery photo"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Video Preview */}
                {profile?.video_url ? (
                  <div className="relative aspect-video bg-gray-100">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(profile.video_url)}`}
                      title="Streamer preview video"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                    <div className="text-sm text-gray-500">No preview video available</div>
                  </div>
                )}

                {/* Booking Info */}
                <div className="p-6">
                  {/* Price */}
                  <div className="flex items-baseline justify-between mb-6">
                    <div className="text-3xl font-semibold text-gray-900">
                      Rp {new Intl.NumberFormat('id-ID').format(profile?.price || 0)}
                    </div>
                    <div className="text-sm text-gray-500">per hour</div>
                  </div>

                  {/* Trial Info */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Star className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-900">
                          100% Refundable Trial
                        </div>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Try another streamer for free or get a refund
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                      onClick={() => setIsBookingModalOpen(true)}
                    >
                      Book Livestreamer
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={handleMessageClick}
                      disabled={isMessageLoading}
                    >
                      {isMessageLoading ? 'Opening chat...' : 'Send message'}
                    </Button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Usually responds in 1 hour
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      5 lesson bookings in the last 48 hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-[680px] p-0 overflow-hidden rounded-2xl bg-white max-h-[85vh] flex flex-col fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] booking-dialog-mobile">
          {/* Hero Section with Streamer Info - Fixed height */}
          <div className="relative h-48 flex-shrink-0">
            {/* Background Image with Gradient */}
            <div className="absolute inset-0">
              <Image
                src={profile.image_url}
                alt={formatName(profile.first_name, profile.last_name)}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
            </div>

            {/* Close Button */}
            <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-optimized">
              <X className="h-4 w-4 text-white" />
            </DialogClose>

            {/* Streamer Info */}
            <div className="absolute bottom-0 w-full p-6">
              <div className="flex items-end gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 backdrop-blur-sm">
                  <Image
                    src={profile.image_url}
                    alt={formatName(profile.first_name, profile.last_name)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 mb-1">
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {formatName(profile.first_name, profile.last_name)}
                  </h2>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{profile.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* Step 1: Basic Requirements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium text-xs">1</span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-800">Persyaratan Dasar</h3>
                </div>
                
                <div className="ml-8 space-y-5">
                  {/* Shipping Option */}
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Pengiriman Produk
                      <span className="text-red-500">*</span>
                      <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          Wajib diisi sebelum memilih tanggal
                        </div>
                      </div>
                    </Label>
                    <Select
                      value={needsShipping || undefined}
                      onValueChange={(value) => setNeedsShipping(value as ShippingOption)}
                    >
                      <SelectTrigger 
                        id="shipping-needed" 
                        className={cn(
                          "w-full bg-white h-10 text-sm transition-all px-3",
                          needsShipping === 'yes' 
                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100 text-blue-700 shadow-sm" 
                            : needsShipping === 'no'
                            ? "border-gray-200 text-gray-700 shadow-sm"
                            : "text-gray-500 border-gray-300 border-dashed"
                        )}
                      >
                        <SelectValue placeholder="Apakah Anda perlu mengirim produk ke streamer?" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom" 
                        align="start" 
                        sideOffset={8}
                        className="z-[9999]"
                      >
                        <SelectItem value="yes" className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-100 rounded-md flex-shrink-0">
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">Ya</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="no" className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-100 rounded-md flex-shrink-0">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">Tidak</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Shipping Notes */}
                    <div className={cn(
                      "text-sm text-gray-600 pl-1",
                      needsShipping === 'yes' && "text-blue-700"
                    )}>
                      {needsShipping === 'yes' ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-medium">Pengiriman Diperlukan</p>
                              <p className="text-sm text-blue-600">
                                {clientLocation.toLowerCase() === profile.location.toLowerCase()
                                  ? "Pemesanan dapat dilakukan mulai besok untuk memastikan pengiriman produk"
                                  : "Pemesanan dapat dilakukan minimal 3 hari dari sekarang untuk memastikan pengiriman produk"
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : needsShipping === 'no' ? (
                        <div className="pl-1 mt-1.5">
                          <p className="text-sm text-gray-500">Pemesanan dapat dilakukan mulai besok</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Platform Selection */}
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Platform Streaming
                      <span className="text-red-500">*</span>
                      <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          Wajib diisi sebelum memilih tanggal
                        </div>
                      </div>
                    </Label>
                    <Select 
                      value={platform || undefined}
                      onValueChange={setPlatform} 
                    >
                      <SelectTrigger 
                        id="booking-platform" 
                        className={cn(
                          "w-full bg-white h-10 text-sm transition-all px-3",
                          platform 
                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100 text-blue-700 shadow-sm"
                            : "text-gray-500 border-gray-300 border-dashed"
                        )}
                      >
                        <SelectValue placeholder="Platform mana yang Anda pilih?" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom" 
                        align="start" 
                        sideOffset={8}
                        className="z-[9999]"
                      >
                        <SelectItem value="Shopee" className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-orange-100 rounded-md flex-shrink-0">
                              <Monitor className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium">Shopee Live</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="TikTok" className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-100 rounded-md flex-shrink-0">
                              <Monitor className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">TikTok Live</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Platform Notes */}
                    {platform && (
                      <div className="pl-1 mt-1.5">
                        <p className="text-sm text-gray-500">
                          {platform === 'Shopee' ? 'Pembelian langsung dengan tautan produk' : 'Jangkau audiens yang lebih luas'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {!isRequirementsValid && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs text-red-600">
                        Please complete all booking requirements before selecting dates
                      </p>
                    </div>
                  )}
                  <BookingCalendar
                    selectedDate={selectedDate}
                    onDateSelect={(dateStr) => handleDateSelect(new Date(dateStr))}
                    onTimeSelect={(time) => {
                      if (selectedDate) {
                        const [hours, minutes] = time.split(':').map(Number);
                        const newDate = new Date(selectedDate);
                        newDate.setHours(hours, minutes, 0, 0);
                        setSelectedDate(newDate);
                      }
                    }}
                    isRequirementsValid={isRequirementsValid}
                    selectedDates={selectedDates}
                    isDateSelectable={(date) => {
                      if (needsShipping === 'yes' && !clientLocation) return false;
                      const startOfTomorrow = startOfDay(addDays(new Date(), 1));
                      if (isBefore(date, startOfTomorrow)) return false;
                      if (needsShipping === 'yes') {
                        const daysToAdd = clientLocation.toLowerCase() === profile.location.toLowerCase() ? 1 : 3;
                        return !isBefore(date, addDays(startOfTomorrow, daysToAdd - 1));
                      }
                      return true;
                    }}
                    hasAvailableSchedule={hasAvailableSchedule}
                  />
                </div>
              </div>

              {/* Time Slots Section */}
              {Array.from(selectedDates.entries()).map(([dateKey, dateInfo]) => (
                <div key={dateKey} className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{format(dateInfo.date, 'EEEE, MMMM d')}</h4>
                    <button
                      onClick={() => {
                        setSelectedDates(prev => {
                          const next = new Map(prev);
                          next.delete(dateKey);
                          return next;
                        });
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {(() => {
                      const daySchedule = activeSchedule?.[dateInfo.date.getDay()];
                      const availableHours: string[] = [];
                      
                      if (daySchedule?.slots) {
                        daySchedule.slots.forEach((slot: any) => {
                          const startHour = parseInt(slot.start);
                          const endHour = parseInt(slot.end);
                          
                          for (let hour = startHour; hour <= endHour; hour++) {
                            const hourString = `${hour.toString().padStart(2, '0')}:00`;
                            if (isSlotAvailable(dateInfo.date, hour) || dateInfo.hours.includes(hourString)) {
                              availableHours.push(hourString);
                            }
                          }
                        });
                      }

                      return availableHours.sort().map(hour => {
                        const isSelected = dateInfo.hours.includes(hour);
                        const hourNum = parseInt(hour);
                        const selectedHourNums = dateInfo.hours.map((h: string) => parseInt(h));
                        const minHour = Math.min(...selectedHourNums);
                        const maxHour = Math.max(...selectedHourNums);
                        const isDisabled = dateInfo.hours.length > 0 && 
                          !isSelected && 
                          hourNum !== maxHour + 1 && 
                          hourNum !== minHour - 1;

                        return (
                          <Button
                            key={hour}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "w-full h-9 p-0 text-xs font-medium",
                              isSelected && "bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white border-0",
                              !isSelected && !isDisabled && "hover:border-blue-200 hover:bg-blue-50",
                              isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => handleTimeSlotSelect(dateKey, hour)}
                            disabled={isDisabled}
                          >
                            {hour}
                          </Button>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="p-6 border-t border-gray-100 bg-white flex-shrink-0">
            <Button
              onClick={handleBooking}
              disabled={!isMinimumBookingMet() || !platform}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium"
            >
              {!platform
                ? 'Please select platform'
                : !isMinimumBookingMet()
                ? 'Select at least 2 hours'
                : 'Continue to Booking'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 