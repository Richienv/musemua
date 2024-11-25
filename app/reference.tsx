import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Star, StarHalf, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { createClient } from "@/utils/supabase/client";
import { format, addDays, startOfWeek, addWeeks, isSameDay, endOfWeek, isAfter, isBefore, startOfDay, subWeeks } from 'date-fns';
import { toast } from 'react-hot-toast';

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
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
      <span className="ml-1 text-sm text-foreground/70">
        {rating > 0 ? rating.toFixed(1) : "Not rated yet"}
      </span>
    </div>
  );
}

function formatPrice(price: number): string {
  if (price < 1000) {
    return `Rp ${price}`;
  }
  const firstTwoDigits = Math.floor(price / 1000);
  return `Rp ${firstTwoDigits}K`;
}

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [extendedProfile, setExtendedProfile] = useState<StreamerProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [platform, setPlatform] = useState(streamer.platform);
  const [specialRequest, setSpecialRequest] = useState('');
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (isProfileModalOpen) {
      fetchExtendedProfile();
    }
  }, [isProfileModalOpen]);

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
          (hour === bookingEnd.getHours() && bookingEnd.getHours() > bookingStart.getHours())
        )
      );
    });

    return isInSchedule && !bookingExists;
  }, [activeSchedule, bookings]);

  const handleBooking = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to book a streamer');
      return;
    }

    if (!selectedDate || selectedHours.length === 0) {
      alert('Please select a date and time for your booking');
      return;
    }

    const startDateTime = new Date(selectedDate!);
    startDateTime.setHours(parseInt(selectedHours[0]), 0, 0, 0);
    const endDateTime = new Date(selectedDate!);
    endDateTime.setHours(parseInt(selectedHours[selectedHours.length - 1]), 0, 0, 0);

    // Calculate duration in hours
    const durationHours = calculateDuration(startDateTime, endDateTime);

    // Calculate total price
    const totalPrice = streamer.price * durationHours;

    try {
      // Check if the slot is still available
      const isAvailable = selectedHours.every(hour => 
        isSlotAvailable(selectedDate!, parseInt(hour))
      );

      if (!isAvailable) {
        toast.error('Selected time slot is no longer available. Please choose another time.');
        await fetchAcceptedBookings(); // Refresh bookings
        return;
      }

      // Fetch client's name
      const { data: clientData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        alert('Failed to fetch user data. Please try again.');
        return;
      }

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          streamer_id: streamer.id,
          client_id: user.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          platform: platform,
          price: totalPrice,
          status: 'pending',
          special_request: specialRequest,
          client_first_name: clientData.first_name,
          client_last_name: clientData.last_name
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        toast.error('Failed to create booking. Please try again.');
        return;
      }

      console.log('Booking created:', bookingData);

      // Create notification for client
      const clientNotificationMessage = `You've successfully booked "${streamer.first_name} ${streamer.last_name}" for ${format(startDateTime, 'dd MMMM HH:mm')} - ${format(endDateTime, 'HH:mm')} (${durationHours} hours) on ${platform}.`;
      
      const { error: clientNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          message: clientNotificationMessage,
          type: 'confirmation',
          is_read: false
        });

      if (clientNotificationError) {
        console.error('Error creating client notification:', clientNotificationError);
      }

      // Fetch streamer's user_id
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('user_id')
        .eq('id', streamer.id)
        .single();

      if (streamerError) {
        console.error('Error fetching streamer data:', streamerError);
        throw streamerError;
      }

      if (!streamerData || !streamerData.user_id) {
        throw new Error('Streamer user_id not found');
      }

      // Create notification for streamer
      const { data: streamerUserData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const clientName = streamerUserData ? `${streamerUserData.first_name} ${streamerUserData.last_name}` : 'A client';
      const streamerNotificationMessage = `${clientName} has booked your services for ${format(startDateTime, 'dd MMMM HH:mm')} - ${format(endDateTime, 'HH:mm')} (${durationHours} hours) on ${platform}.`;
      
      const { error: streamerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: streamerData.user_id,
          message: streamerNotificationMessage,
          type: 'info',
          is_read: false
        });

      if (streamerNotificationError) {
        console.error('Error creating streamer notification:', streamerNotificationError);
      }

      await fetchAcceptedBookings(); // Refresh the bookings
      setIsBookingModalOpen(false);
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Unexpected error during booking process:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
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
    selectedDateTime.setHours(parseInt(hour));
    return selectedDateTime < new Date() || !isSlotAvailable(selectedDate, parseInt(hour));
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

  return (
    <>
      <div className="bg-background border border-foreground/10 shadow-md rounded-lg overflow-hidden transition-colors duration-300 w-full max-w-sm"> {/* Changed max-w-md to max-w-sm */}
        <div className="relative w-full h-64"> {/* Reduced height from h-80 to h-64 */}
          <img
            src={streamer.image_url}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4"> {/* Reduced padding from p-6 to p-4 */}
          <div className="inline-block bg-[#000080] rounded-full px-2 py-1 mb-2"> {/* Adjusted padding and margin */}
            <p className="text-white/100 text-xs font-semibold">{streamer.platform}</p>
          </div>

          <h3 className="font-bold text-lg mb-1 text-foreground">{fullName}</h3> {/* Reduced font size */}
          <p className="text-sm text-foreground/70 mb-1">{streamer.category}</p>
          <div className="flex items-center text-xs text-foreground/70 mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            {streamer.location}
          </div>
          <p className="text-xs text-foreground/80 mb-2 line-clamp-2">{streamer.bio}</p>
          <RatingStars rating={streamer.rating} />
          <p className="text-foreground font-medium text-base mt-2">{formatPrice(streamer.price)} / Hour</p>
          <div className="mt-3 flex flex-col space-y-2"> {/* Changed to flex-col and added space-y-2 */}
            <Button 
              variant="outline" 
              className="w-full text-sm py-1"
              onClick={() => setIsProfileModalOpen(true)}
            >
              View Profile
            </Button>
            <Button 
              className="w-full bg-[#000080] hover:bg-[#000080]/90 text-sm py-1"
              onClick={openBookingModal}
            >
              Book Livestreamer
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center space-x-4 mb-4">
              <Image
                src={streamer.image_url}
                alt={`${streamer.first_name} ${streamer.last_name}`}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <div>
                <DialogTitle className="text-lg">Book {streamer.first_name} {streamer.last_name}</DialogTitle>
                <DialogDescription className="text-sm">Select a date and time</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <Button onClick={handlePreviousWeek} variant="outline" size="sm">Previous Week</Button>
              <span>{format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d')}</span>
              <Button onClick={handleNextWeek} variant="outline" size="sm">Next Week</Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <Button
                  key={day.toISOString()}
                  variant={isSameDay(day, selectedDate || new Date()) ? "default" : "ghost"}
                  className={`p-1 h-auto flex flex-col ${
                    isSameDay(day, selectedDate || new Date())
                      ? 'bg-[#000080] text-white hover:bg-[#000080]/90'
                      : ''
                  }`}
                  onClick={() => setSelectedDate(day)}
                  disabled={day < startOfDay(new Date()) || isDayOff(day)}
                >
                  <span className="text-[10px]">{format(day, 'EEE')}</span>
                  <span className="text-xs font-bold">{format(day, 'd')}</span>
                </Button>
              ))}
            </div>
            <div className="h-px bg-border my-2" />
            {timeOptions.length > 0 ? (
              <div className="space-y-2">
                {['Night', 'Morning', 'Afternoon', 'Evening'].map((timeOfDay) => (
                  <div key={timeOfDay}>
                    <h4 className="text-xs font-semibold mb-1">{timeOfDay}</h4>
                    <div className="grid grid-cols-3 gap-1">
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
                            size="sm"
                            className={`text-xs p-1 h-auto ${isHourSelected(hour) ? 'bg-[#000080] text-white hover:bg-[#000080]/90' : ''}`}
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
              <div className="text-center text-gray-500">No available slots for this day</div>
            )}
            {selectedHours.length > 0 && (
              <div className="text-xs">
                Selected time: {selectedHours[0]} - {selectedHours[selectedHours.length - 1]}
                ({selectedHours.length} hour{selectedHours.length > 1 ? 's' : ''})
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="booking-platform" className="text-right">Platform</Label>
              <Select onValueChange={setPlatform} value={platform}>
                <SelectTrigger id="booking-platform" className="col-span-3 h-8 text-xs">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Twitch">Twitch</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="booking-special-request" className="text-right">Request</Label>
              <Input 
                id="booking-special-request" 
                className="col-span-3 h-8 text-xs" 
                value={specialRequest} 
                onChange={(e) => setSpecialRequest(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBooking} className="w-full bg-[#000080] hover:bg-[#000080]/90 text-white">
              Submit Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          {extendedProfile && (
            <>
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <Image
                    src={extendedProfile.image_url}
                    alt={fullName}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                  <div>
                    {fullName}
                    <p className="text-sm font-normal text-foreground/70">{extendedProfile.category}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-semibold">Age:</span> {extendedProfile.age}</p>
                  <p><span className="font-semibold">Gender:</span> {extendedProfile.gender}</p>
                  <p><span className="font-semibold">Experience:</span> {extendedProfile.experience}</p>
                  <p><span className="font-semibold">Location:</span> {extendedProfile.location}</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1">About Me</h3>
                  <p className="text-sm">{extendedProfile.fullBio}</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1">Gallery</h3>
                  {extendedProfile.video_url && (
                    <div className="mb-2">
                      <iframe
                        width="100%"
                        height="280"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(extendedProfile.video_url) || ''}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1">
                    {extendedProfile.gallery.photos.map((photo) => (
                      <Image
                        key={photo.id}
                        src={photo.photo_url}
                        alt={`Gallery photo ${photo.order_number}`}
                        width={150}
                        height={150}
                        className="rounded object-cover"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1">Client Testimonials</h3>
                  {extendedProfile.testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-blue-100 p-3 rounded mb-2 text-xs">
                      <p className="italic text-blue-800">"{testimonial.comment}"</p>
                      <p className="font-semibold mt-1 text-blue-900">- {testimonial.client_name}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1 bg-[#000080] hover:bg-[#000080]/90 text-white"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsBookingModalOpen(true);
                    }}
                  >
                    Book Livestreamer
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Message
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