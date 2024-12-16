"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from "@/utils/supabase/client";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, DollarSign, Star, Info, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import RatingModal from '@/components/rating-modal';
import { useRouter } from 'next/navigation';
import CancelBookingModal from '@/components/cancel-booking-modal';

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  platform: string;
  status: string;
  created_at: string;
  price: number;
  special_request: string;
  streamer_id: number;
  streamer: {
    id: number;
    first_name: string;
    last_name: string;
    platform: string;
    rating?: number;
    image_url: string;
  };
}

interface RatingData {
  streamer_id: number;
  rating: number;
}

const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Menunggu streamer menerima pesanan Anda. Biasanya membutuhkan waktu 15-60 menit untuk konfirmasi.';
    case 'accepted':
      return 'Pesanan Anda telah diterima oleh streamer. Silakan tunggu link streaming yang akan diberikan saat waktu yang ditentukan.';
    case 'completed':
      return 'Sesi streaming telah selesai. Terima kasih telah menggunakan layanan kami.';
    case 'rejected':
      return 'Maaf, streamer tidak dapat menerima pesanan Anda. Silakan coba waktu lain atau streamer lainnya.';
    case 'live':
      return 'Sesi streaming sedang berlangsung.';
    default:
      return '';
  }
};

function BookingEntry({ booking, onRatingSubmit }: { booking: Booking; onRatingSubmit: () => void }) {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  console.log('Booking status:', booking.status); // Add this line for debugging

  // Parse the rating to ensure it's a number
  const rating = parseFloat(booking.streamer.rating as unknown as string);

  return (
    <div className="border rounded-lg shadow-sm p-4 mb-4 text-sm hover:shadow-md transition-shadow">
      {/* Top layer - Status and date position switched */}
      <div className="flex justify-between items-center mb-3 pb-3 border-b">
        <div className="flex items-center gap-1">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)} flex items-center`}>
            {booking.status}
            <div className="group relative inline-block ml-1">
              <div className="rounded-full">
                <Info className="h-3 w-3 text-current opacity-70 stroke-[2.5]" />
              </div>
              <div className="invisible group-hover:visible absolute z-10 w-72 bg-black text-white text-sm rounded-md p-3 left-0 mt-1">
                {getStatusInfo(booking.status)}
              </div>
            </div>
          </span>
        </div>
        <span className="text-gray-500 text-sm">{format(new Date(booking.created_at), 'MMM d, yyyy HH:mm')}</span>
      </div>
      
      {/* Middle layer - Removed duplicate name */}
      <div className="flex items-start mb-3 pb-3 border-b">
        <Image 
          src={booking.streamer.image_url || '/default-avatar.png'}
          alt={`${booking.streamer.first_name} ${booking.streamer.last_name}`}
          width={80}
          height={80}
          className="rounded-full mr-4"
        />
        <div className="flex-grow">
          <h3 className="font-medium text-base mb-2">{`${booking.streamer.first_name} ${booking.streamer.last_name}`}</h3>
          <p className="text-gray-600 mb-2">Livestreaming services on {booking.platform}</p>
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-base">{`${format(new Date(booking.start_time), 'HH:mm')} - ${format(new Date(booking.end_time), 'HH:mm')}`}</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="text-base">Rating: {isNaN(rating) ? 'N/A' : rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
      
      {/* Bottom layer - Updated with new buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-500" />
          <span className="font-semibold text-lg">Rp {booking.price.toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          {booking.status.toLowerCase() === 'completed' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:text-white"
              onClick={() => setIsRatingModalOpen(true)}
            >
              Give Rating
            </Button>
          )}
          {(booking.status.toLowerCase() === 'pending' || booking.status.toLowerCase() === 'accepted') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-sm py-2 px-4 border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm py-2 px-4 border-orange-500 text-orange-500 hover:bg-orange-50"
                onClick={() => setIsRescheduleModalOpen(true)}
              >
                Reschedule
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {isRatingModalOpen && (
        <RatingModal 
          isOpen={isRatingModalOpen} 
          onClose={() => setIsRatingModalOpen(false)} 
          bookingId={booking.id}
          streamerId={booking.streamer.id}
          streamerName={`${booking.streamer.first_name} ${booking.streamer.last_name}`}
          streamerImage={booking.streamer.image_url}
          startDate={booking.start_time}
          endDate={booking.end_time}
          onSubmit={onRatingSubmit}
        />
      )}
      
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        bookingId={booking.id}
        streamer_id={booking.streamer.id}
        start_time={booking.start_time}
      />

      <CancelBookingModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        bookingId={booking.id}
        streamer_id={booking.streamer.id}
        start_time={booking.start_time}
        isReschedule
      />
    </div>
  );
}

export default function ClientBookings() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;

  const fetchClientData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Fetch client name
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setClientName(userData.first_name);
      } else if (userError) {
        console.error("Error fetching user data:", userError);
        setError("Failed to fetch user data");
      }

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          platform,
          status,
          created_at,
          price,
          special_request,
          streamer:streamer_id (
            id,
            first_name,
            last_name,
            platform,
            image_url
          )
        `)
        .eq('client_id', user.id)
        .not('status', 'eq', 'payment_pending')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError("Failed to fetch bookings");
      } else if (bookingsData) {
        // Get unique streamer IDs
        const streamerIds = Array.from(
          new Set(
            bookingsData.map((booking: any) => booking.streamer.id)
          )
        );

        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('streamer_ratings')
          .select('streamer_id, rating')
          .in('streamer_id', streamerIds);

        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError);
        } else {
          // Calculate average ratings with proper typing
          const averageRatings = (ratingsData || []).reduce((acc: Record<number, { sum: number; count: number }>, curr) => {
            if (!acc[curr.streamer_id]) {
              acc[curr.streamer_id] = { sum: 0, count: 0 };
            }
            acc[curr.streamer_id].sum += curr.rating;
            acc[curr.streamer_id].count += 1;
            return acc;
          }, {});

          // Add ratings to bookings with proper typing
          const bookingsWithRatings: Booking[] = bookingsData.map((booking: any) => ({
            ...booking,
            streamer_id: booking.streamer.id,
            streamer: {
              ...booking.streamer,
              rating: averageRatings[booking.streamer.id]
                ? (averageRatings[booking.streamer.id].sum / averageRatings[booking.streamer.id].count)
                : 0
            }
          }));

          setBookings(bookingsWithRatings);
        }
      } else {
        setBookings([]);
      }
    } else {
      setError("User not authenticated");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const refreshBookings = () => {
    fetchClientData();
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) {
    return <div className="container mx-auto p-4 text-sm">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-sm">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl font-sans pt-12">
      <div className="mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => router.push('/protected')} 
            variant="ghost" 
            size="lg"
            className="text-gray-600 hover:text-gray-800 p-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center justify-between flex-grow">
            <h1 className="text-2xl">{clientName}'s Bookings</h1>
            <Button 
              onClick={refreshBookings} 
              size="sm" 
              variant="ghost"
              className="p-2"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {currentBookings.map((booking) => (
          <BookingEntry key={booking.id} booking={booking} onRatingSubmit={refreshBookings} />
        ))}
        {bookings.length === 0 && (
          <p className="text-center mt-4 text-gray-500">No bookings found.</p>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <Button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          size="sm"
          variant="ghost"
          className="p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm">Page {currentPage} of {Math.ceil(bookings.length / bookingsPerPage)}</span>
        <Button
          onClick={() => paginate(currentPage + 1)}
          disabled={indexOfLastBooking >= bookings.length}
          size="sm"
          variant="ghost"
          className="p-2"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
