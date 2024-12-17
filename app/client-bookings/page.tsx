"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from "@/utils/supabase/client";
import { format, differenceInHours, isBefore, startOfDay } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, DollarSign, Star, Info, RefreshCw, X } from 'lucide-react';
import Image from 'next/image';
import RatingModal from '@/components/rating-modal';
import { useRouter } from 'next/navigation';
import CancelBookingModal from '@/components/cancel-booking-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { BookingCalendar } from '@/components/booking-calendar';

interface Booking {
  id: number;
  client_id: string;
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
  items_received?: boolean;
  items_received_at?: string | null;
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

interface RescheduleTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStartTime: Date, newEndTime: Date) => void;
  currentStartTime: string;
  currentEndTime: string;
}

function RescheduleTimeModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  currentStartTime,
  currentEndTime 
}: RescheduleTimeModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(currentStartTime));
  const [selectedHours, setSelectedHours] = useState<string[]>([format(new Date(currentStartTime), 'HH:00')]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time options based on the selected date
  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      options.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleHourSelection = (hour: string) => {
    setSelectedHours((prevSelected) => {
      const hourNum = parseInt(hour);
      
      if (prevSelected.includes(hour)) {
        const newSelected = prevSelected.filter(h => h !== hour);
        
        if (newSelected.length > 0) {
          const selectedHourNums = newSelected.map(h => parseInt(h));
          const minHour = Math.min(...selectedHourNums);
          const maxHour = Math.max(...selectedHourNums);
          
          return Array.from(
            { length: maxHour - minHour + 1 }, 
            (_, i) => `${(minHour + i).toString().padStart(2, '0')}:00`
          );
        }
        return newSelected;
      } else {
        if (prevSelected.length === 0) {
          return [hour];
        }
        
        const selectedHourNums = prevSelected.map(h => parseInt(h));
        const minHour = Math.min(...selectedHourNums);
        const maxHour = Math.max(...selectedHourNums);
        
        if (hourNum === maxHour + 1 || hourNum === minHour - 1) {
          const newSelected = [...prevSelected, hour];
          return newSelected.sort((a, b) => parseInt(a) - parseInt(b));
        }
        
        return [hour];
      }
    });
  };

  const isHourSelected = (hour: string) => selectedHours.includes(hour);

  const isHourDisabled = (hour: string) => {
    const hourNum = parseInt(hour);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hourNum, 0, 0, 0);
    const now = new Date();
    
    if (isBefore(selectedDateTime, now)) return true;
    
    if (selectedHours.length === 0) return false;
    
    const selectedHourNums = selectedHours.map(h => parseInt(h));
    const minHour = Math.min(...selectedHourNums);
    const maxHour = Math.max(...selectedHourNums);
    
    return hourNum !== maxHour + 1 && hourNum !== minHour - 1;
  };

  const getSelectedTimeRange = () => {
    if (selectedHours.length === 0) return '';
    const startTime = selectedHours[0];
    const endTime = selectedHours[selectedHours.length - 1];
    const duration = selectedHours.length;
    return `${startTime} - ${endTime} (${duration} hour${duration !== 1 ? 's' : ''})`;
  };

  const handleSubmit = () => {
    if (selectedHours.length < 1) {
      toast.error("Please select at least one hour");
      return;
    }

    setIsSubmitting(true);
    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(selectedHours[0]), 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(parseInt(selectedHours[selectedHours.length - 1]) + 1, 0, 0, 0);
      
      onConfirm(startTime, endTime);
    } catch (error) {
      console.error('Error processing reschedule:', error);
      toast.error("Failed to reschedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-semibold mb-0.5">
            Reschedule Booking
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Select your new preferred date and time
          </DialogDescription>
        </DialogHeader>

        <BookingCalendar 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isDayOff={(date) => isBefore(date, startOfDay(new Date()))}
          selectedClassName="bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white hover:from-[#1e3a8a] hover:to-[#581c87]"
        />

        <div className="h-px bg-gray-200" />

        <div className="space-y-3 sm:space-y-4">
          {['Morning', 'Afternoon', 'Evening', 'Night'].map((timeOfDay) => (
            <div key={timeOfDay}>
              <h4 className="text-xs sm:text-sm font-semibold mb-2">{timeOfDay}</h4>
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {timeOptions
                  .filter((hour) => {
                    const hourNum = parseInt(hour);
                    return (
                      (timeOfDay === 'Night' && (hourNum >= 0 && hourNum < 6)) ||
                      (timeOfDay === 'Morning' && (hourNum >= 6 && hourNum < 12)) ||
                      (timeOfDay === 'Afternoon' && (hourNum >= 12 && hourNum < 18)) ||
                      (timeOfDay === 'Evening' && (hourNum >= 18 && hourNum < 24))
                    );
                  })
                  .map((hour) => (
                    <Button
                      key={hour}
                      variant={isHourSelected(hour) ? "default" : "outline"}
                      className={`text-[10px] sm:text-sm p-1 sm:p-2 h-auto ${
                        isHourSelected(hour) 
                          ? 'bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white hover:from-[#1e3a8a] hover:to-[#581c87]' 
                          : 'hover:bg-blue-50'
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

        {selectedHours.length > 0 && (
          <div className="text-xs sm:text-sm font-medium mt-4">
            Selected time: {getSelectedTimeRange()}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedHours.length < 1}
            className="flex-1 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] hover:to-[#581c87] text-white"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

function CancelConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting
}: CancelConfirmationModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Alasan pembatalan harus diisi');
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-3 sm:p-6 bg-white/95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-semibold mb-0.5 text-red-600">
            Konfirmasi Pembatalan
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base space-y-2">
            <p className="text-red-500 font-medium">
              Peringatan:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>Pembatalan akan mempengaruhi reputasi Anda sebagai client</li>
              <li>Pembatalan mendadak dapat menyebabkan kerugian bagi streamer</li>
              <li>Mohon pertimbangkan kembali sebelum membatalkan pesanan</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason" className="text-sm font-medium">
              Alasan Pembatalan<span className="text-red-500">*</span>
            </Label>
            <textarea
              id="cancel-reason"
              className={`w-full min-h-[100px] p-3 rounded-md border ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
              placeholder="Mohon jelaskan alasan pembatalan Anda..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-gray-300 hover:bg-gray-50"
          >
            Kembali
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? 'Memproses...' : 'Lanjutkan Pembatalan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingEntry({ booking, onRatingSubmit }: { booking: Booking; onRatingSubmit: () => void }) {
  const router = useRouter();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

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

  const handleReschedule = async (newStartTime: Date, newEndTime: Date) => {
    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Create notification for streamer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.streamer_id,
          message: `Client telah menyetujui jadwal baru untuk sesi live streaming.`,
          type: 'reschedule_accepted',
          booking_id: booking.id,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      setIsRescheduleModalOpen(false);
      toast.success("Jadwal berhasil diperbarui");
      router.refresh();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error("Gagal memperbarui jadwal");
    }
  };

  const handleCancel = async (reason: string) => {
    setIsSubmittingCancel(true);
    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancel_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Create notification for streamer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.streamer_id,
          message: `Client telah membatalkan permintaan reschedule dengan alasan: ${reason}`,
          type: 'reschedule_cancelled',
          booking_id: booking.id,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      setIsCancelModalOpen(false);
      toast.success("Booking berhasil dibatalkan");
      router.refresh();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error("Gagal membatalkan booking");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

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
        </div>
      </div>

      {/* Add these buttons only for reschedule_requested status */}
      {booking.status === 'reschedule_requested' && (
        <div className="flex justify-end gap-2 mt-4">
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
            className="text-sm py-2 px-4 border-[#E23744] text-[#E23744] hover:bg-[#E23744]/5"
            onClick={() => setIsRescheduleModalOpen(true)}
          >
            Reschedule
          </Button>
        </div>
      )}

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

      <RescheduleTimeModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onConfirm={handleReschedule}
        currentStartTime={booking.start_time}
        currentEndTime={booking.end_time}
      />

      <CancelConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        isSubmitting={isSubmittingCancel}
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
