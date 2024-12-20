"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAction, acceptBooking, rejectBooking, startStream, endStream } from "@/app/actions";
import { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, isToday, isThisWeek, isThisMonth, parseISO, differenceInHours, addHours, parse } from 'date-fns';
import { Calendar, Clock, Monitor, DollarSign, MessageSquare, Link as LinkIcon, AlertTriangle, MapPin, Users, XCircle, Video, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/ui/navbar";
import { streamerService, type StreamerStats, type StreamerGalleryPhoto } from "@/services/streamer/streamer-service";
import { format as formatDate } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from 'next/image';
import { BookingCalendar, type BookingCalendarProps } from "@/components/booking-calendar";

interface UserData {
  user_type: string;
  first_name: string;
}

interface Booking {
  id: number;
  client_id: string;
  client_first_name: string;
  client_last_name: string;
  streamer_id: number;
  start_time: string;
  end_time: string;
  platform: string;
  status: string;
  price: number;
  special_request?: string | null;
  stream_link?: string | null;
  sub_acc_link?: string | null;
  sub_acc_pass?: string | null;
  items_received?: boolean;
  items_received_at?: string | null;
}

// Add these utility functions at the top of the file
const roundToNearestHour = (date: Date): Date => {
  const rounded = new Date(date);
  rounded.setMinutes(date.getMinutes() >= 30 ? 60 : 0);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
};

const calculateDuration = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
};

// Add this function at the top level of the file
function formatPrice(price: number): string {
  if (price < 1000) {
    return `Rp ${price}`;
  }
  const firstTwoDigits = Math.floor(price / 1000);
  return `Rp ${firstTwoDigits}K`;
}

function SubAccountLink({ link }: { link: string }) {
  return (
    <div className="mt-2 p-2 bg-gray-100 rounded-md text-xs">
      <p className="font-medium text-gray-700 flex items-center">
        <LinkIcon className="h-3 w-3 mr-1" />
        Sub Account Link:
      </p>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:underline break-all"
      >
        {link}
      </a>
    </div>
  );
}

function ItemAcceptanceModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (confirmed: boolean) => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSubmit = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(true);
    } catch (error) {
      console.error('Error confirming item acceptance:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 fixed left-[46%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-32px)] sm:w-full max-w-lg rounded-lg">
        <div className="px-6 pt-6 pb-4 space-y-6">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-xl font-semibold">
              Konfirmasi Penerimaan Barang
            </DialogTitle>
            <DialogDescription className="text-base">
              Mohon konfirmasi bahwa Anda telah menerima barang dari client.
            </DialogDescription>
          </DialogHeader>

          {/* Guidelines Section */}
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 space-y-3">
              <h4 className="text-red-600 font-medium">
                Panduan Penerimaan Barang:
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-red-700">
                <li>Pastikan barang dalam kondisi baik dan sesuai dengan deskripsi</li>
                <li>Periksa kelengkapan dan kualitas setiap item</li>
                <li>Simpan foto kemasan dan isi paket sebagai dokumentasi</li>
              </ul>
            </div>

            {/* Warning Section */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Penting:</p>
                  <p>Pastikan Anda telah menyimpan foto bukti penerimaan barang sebelum melanjutkan. Foto ini diperlukan untuk dokumentasi dan perlindungan Anda sebagai streamer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConfirming}
              className="w-full sm:w-auto order-1 sm:order-none"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isConfirming}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Konfirmasi Penerimaan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RescheduleModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  booking 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  booking: Booking;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Alasan reschedule harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      
      // Update the existing booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'reschedule_requested',
          updated_at: new Date().toISOString(),
          reason: reason
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Create notification for client
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          message: `Streamer mengajukan reschedule untuk sesi live streaming Anda. Alasan: ${reason}`,
          type: 'reschedule_request',
          booking_id: booking.id,
          created_at: new Date().toISOString(),
          is_read: false,
          streamer_id: booking.streamer_id
        });

      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      // Close the modal and show single toast notification
      onClose();
      toast.success('Pengajuan reschedule berhasil dikirim');
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      toast.error('Gagal mengajukan reschedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[46%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-32px)] sm:w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-semibold mb-0.5">
            Pengajuan Reschedule
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Mohon berikan alasan untuk pengajuan reschedule
          </DialogDescription>
        </DialogHeader>

        {/* Policy Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-800">
                Kebijakan Reschedule:
              </p>
              <ul className="text-xs text-red-700 space-y-1 list-disc pl-4">
                <li>Pengajuan reschedule akan mempengaruhi performa dan reputasi Anda sebagai streamer</li>
                <li>Reschedule mendadak dapat mengurangi tingkat kepercayaan client</li>
                <li>Pastikan Anda memiliki alasan yang kuat sebelum mengajukan reschedule</li>
                <li>Pengajuan reschedule yang terlalu sering dapat mempengaruhi visibilitas profil Anda</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reason Field */}
        <div className="space-y-2">
          <Label htmlFor="reschedule-reason" className="text-sm font-medium">
            Alasan Reschedule<span className="text-red-500">*</span>
          </Label>
          <textarea
            id="reschedule-reason"
            className={`w-full min-h-[100px] p-3 rounded-md border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm`}
            placeholder="Mohon jelaskan alasan Anda mengajukan reschedule..."
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

        <DialogFooter className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// First, define the function type for stream handlers
type StreamHandler = () => void;

// Update the ScheduleCard component props interface
interface ScheduleCardProps {
  booking: Booking;
  onStreamStart: StreamHandler;
  onStreamEnd: StreamHandler;
}

function ScheduleCard({ booking, onStreamStart, onStreamEnd }: ScheduleCardProps) {
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false);
  const [isItemAcceptanceModalOpen, setIsItemAcceptanceModalOpen] = useState(false);
  const [streamLink, setStreamLink] = useState(booking.stream_link || '');
  const [isStarting, setIsStarting] = useState(false);
  const [hasAcceptedItems, setHasAcceptedItems] = useState(booking.items_received || false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const handleItemAcceptance = async (confirmed: boolean) => {
    if (!confirmed) return;
    
    try {
      const supabase = createClient();
      
      // Update booking with item acceptance
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          items_received: true,
          items_received_at: new Date().toISOString()
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Create notification for client
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          message: 'Streamer telah menerima barang Anda dan siap untuk memulai live streaming.',
          type: 'item_received',
          booking_id: booking.id,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't throw here, just log the error
      }

      setHasAcceptedItems(true);
      setIsItemAcceptanceModalOpen(false);
      toast.success('Konfirmasi penerimaan barang berhasil');
    } catch (error) {
      console.error('Error confirming item acceptance:', error);
      toast.error('Gagal mengkonfirmasi penerimaan barang');
    }
  };

  const handleStartLive = async () => {
    setIsStarting(true);
    const result = await startStream(booking.id, streamLink);
    setIsStarting(false);
    
    if (result.success) {
      toast.success("Stream started successfully");
      setIsStartLiveModalOpen(false);
      onStreamStart();
    } else {
      toast.error(result.error || "Failed to start stream");
    }
  };

  const handleEndStream = async () => {
    try {
      const supabase = createClient();
      
      // Get streamer data first
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('first_name, last_name')
        .eq('id', booking.streamer_id)
        .single();

      if (streamerError) throw streamerError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          stream_link: null
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Create notification for client using streamerData
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: booking.client_id,
          message: `Stream session with ${streamerData.first_name} ${streamerData.last_name} has ended.`,
          type: 'confirmation',
          booking_id: booking.id,
          created_at: new Date().toISOString(),
          is_read: false
        }]);

      if (notificationError) throw notificationError;

      toast.success("Stream ended successfully");
      onStreamEnd();

    } catch (error) {
      console.error('Error ending stream:', error);
      toast.error("Failed to end stream. Please try again.");
    }
  };

  const handleReschedule = async (reason: string) => {
    try {
      const supabase = createClient();
      
      // Update booking status with reason
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'reschedule_requested',
          updated_at: new Date().toISOString(),
          reason: reason
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Create notification for client
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          message: `Streamer mengajukan reschedule untuk sesi live streaming Anda. Alasan: ${reason}`,
          type: 'reschedule_request',
          booking_id: booking.id,
          created_at: new Date().toISOString(),
          is_read: false,
          streamer_id: booking.streamer_id
        });

      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      setIsRescheduleModalOpen(false);
      toast.success('Pengajuan reschedule berhasil dikirim');
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      toast.error('Gagal mengajukan reschedule');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-[#E23744]/20 transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {booking.client_first_name} {booking.client_last_name}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Jakarta, Indonesia</span>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            booking.status === 'live' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* Booking Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 text-gray-600">
                <DollarSign className="h-5 w-5 text-[#E23744]" />
                <span className="text-sm font-medium">
                  Rp {booking.price.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="h-5 w-5 text-[#E23744]" />
                <span className="text-sm font-medium">
                  {format(new Date(booking.start_time), 'HH:mm')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-5 w-5 text-[#E23744]" />
              <span className="text-sm font-medium">
                {format(new Date(booking.start_time), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-[#E23744]" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.platform.toLowerCase() === 'shopee' 
                  ? 'bg-[#EE4D2D] text-white' 
                  : 'bg-[#E23744] text-white'
              }`}>
                {booking.platform}
              </span>
            </div>
          </div>
        </div>

        {/* Special Request */}
        {booking.special_request && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-[#E23744]" />
              Special Request
            </p>
            <p className="text-sm text-gray-600">{booking.special_request}</p>
          </div>
        )}

        {/* Stream Actions */}
        {booking.status === 'live' ? (
          <Button 
            onClick={handleEndStream}
            className="mt-6 w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl"
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
            End Stream
          </Button>
        ) : booking.status === 'accepted' && (
          <div className="mt-6 space-y-2">
            {!hasAcceptedItems ? (
              <Button
                onClick={() => setIsItemAcceptanceModalOpen(true)}
                className="w-full py-3 bg-[#E23744] hover:bg-[#E23744]/90 text-white font-medium rounded-xl"
              >
                Barang Diterima
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setIsStartLiveModalOpen(true)}
                  className="w-full py-3 bg-[#E23744] hover:bg-[#E23744]/90 text-white font-medium rounded-xl"
                >
                  Start Live
                </Button>
                <button
                  onClick={() => setIsRescheduleModalOpen(true)}
                  className="w-full text-center text-xs text-gray-500 hover:text-[#E23744] transition-colors duration-200"
                >
                  reschedule
                </button>
              </>
            )}
          </div>
        )}

        {/* Item Acceptance Modal */}
        <ItemAcceptanceModal
          isOpen={isItemAcceptanceModalOpen}
          onClose={() => setIsItemAcceptanceModalOpen(false)}
          onConfirm={handleItemAcceptance}
        />

        {/* Start Live Modal - update to include credentials */}
        <Dialog open={isStartLiveModalOpen} onOpenChange={setIsStartLiveModalOpen}>
          <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-32px)] sm:w-full sm:max-w-[500px] p-0 m-0 rounded-lg">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl font-semibold">
                Start Live Stream
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Please use these credentials to log in to your streaming platform.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Account Credentials Section */}
              {booking.platform.toLowerCase() === 'shopee' && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Account Credentials</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">ID:</span>
                      <span className="text-sm font-medium">{booking.sub_acc_link}</span>
                    </div>
                    {booking.sub_acc_pass && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Password:</span>
                        <span className="text-sm font-medium">{booking.sub_acc_pass}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stream Link Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Stream Link</Label>
                <Input
                  placeholder="Enter your stream link"
                  value={streamLink}
                  onChange={(e) => setStreamLink(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 bg-gray-50 border-t">
              <Button
                onClick={handleStartLive}
                disabled={isStarting || !streamLink}
                className="w-full h-11 bg-gradient-to-r from-[#E23744] to-[#E23744]/90 hover:from-[#E23744]/90 hover:to-[#E23744] text-white font-medium"
              >
                {isStarting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Starting...</span>
                  </div>
                ) : (
                  'Start Stream'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Modal */}
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          onConfirm={handleReschedule}
          booking={booking}
        />
      </div>
    </div>
  );
}

function UpcomingSchedule({ bookings, onStreamStart, onStreamEnd }: { 
  bookings: Booking[], 
  onStreamStart: StreamHandler, 
  onStreamEnd: StreamHandler 
}) {
  // Add console.log to debug the data
  console.log('Upcoming Schedule Bookings:', bookings);

  const todayBookings = bookings.filter(booking => isToday(parseISO(booking.start_time)));
  const thisWeekBookings = bookings.filter(booking => 
    isThisWeek(parseISO(booking.start_time)) && !isToday(parseISO(booking.start_time))
  );
  const thisMonthBookings = bookings.filter(booking => 
    isThisMonth(parseISO(booking.start_time)) && !isThisWeek(parseISO(booking.start_time))
  );

  // Update the ScheduleCard mapping to include type safety
  const renderScheduleCards = (bookings: Booking[]) => {
    // Filter out duplicate bookings based on booking ID
    const uniqueBookings = bookings.filter((booking, index, self) =>
      index === self.findIndex((b) => b.id === booking.id)
    );

    return uniqueBookings.map((booking) => (
      <ScheduleCard
        key={booking.id}
        booking={booking}
        onStreamStart={onStreamStart}
        onStreamEnd={onStreamEnd}
      />
    ));
  };

  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg mb-6">
        <TabsTrigger 
          value="today" 
          className="text-sm data-[state=active]:text-[#E23744] data-[state=active]:border-b-2 data-[state=active]:border-[#E23744]"
        >
          Today
        </TabsTrigger>
        <TabsTrigger 
          value="week"
          className="text-sm data-[state=active]:text-[#E23744] data-[state=active]:border-b-2 data-[state=active]:border-[#E23744]"
        >
          This Week
        </TabsTrigger>
        <TabsTrigger 
          value="month"
          className="text-sm data-[state=active]:text-[#E23744] data-[state=active]:border-b-2 data-[state=active]:border-[#E23744]"
        >
          This Month
        </TabsTrigger>
      </TabsList>
      <TabsContent value="today" className="space-y-4">
        {todayBookings.length > 0 ? renderScheduleCards(todayBookings) : (
          <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
            Tidak ada booking untuk hari ini.
          </p>
        )}
      </TabsContent>
      <TabsContent value="week" className="space-y-4">
        {thisWeekBookings.length > 0 ? renderScheduleCards(thisWeekBookings) : (
          <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
            Tidak ada booking untuk minggu ini.
          </p>
        )}
      </TabsContent>
      <TabsContent value="month" className="space-y-4">
        {thisMonthBookings.length > 0 ? renderScheduleCards(thisMonthBookings) : (
          <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
            Tidak ada booking untuk bulan ini.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}

function BookingCard({ booking, onAccept, onReject }: { 
  booking: Booking; 
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-200">
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <div className="space-y-2">
            <h3 className="font-semibold text-base sm:text-lg">
              {booking.client_first_name} {booking.client_last_name}
            </h3>
            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium
              ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
            Rp {booking.price.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 sm:w-6 flex justify-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <span>{format(new Date(booking.start_time), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 sm:w-6 flex justify-center">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <span className="text-sm sm:text-base">
              {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
              <span className="text-gray-400 ml-2">
                ({differenceInHours(new Date(booking.end_time), new Date(booking.start_time))} hours)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 sm:w-6 flex justify-center">
              <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              booking.platform.toLowerCase() === 'shopee' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                : 'bg-gradient-to-r from-[#00f2ea] to-[#ff0050] text-white'
            }`}>
              {booking.platform}
            </span>
          </div>
        </div>

        {/* Special Request */}
        {booking.special_request && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2">
            <p className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              Special Request
            </p>
            <p className="text-xs sm:text-sm text-gray-600">{booking.special_request}</p>
          </div>
        )}

        {/* Actions */}
        {booking.status === 'pending' && (
          <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-100">
            <Button
              onClick={() => onAccept(booking.id)}
              className="flex-1 text-xs sm:text-sm py-2 bg-gradient-to-r from-[#E23744] to-[#E23744]/90 hover:from-[#E23744]/90 hover:to-[#E23744] text-white"
            >
              Accept
            </Button>
            <Button
              onClick={() => onReject(booking.id)}
              variant="outline"
              className="flex-1 text-xs sm:text-sm py-2 border-2 border-[#E23744] text-[#E23744] hover:bg-[#E23744]/10"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Update the AnalyticsCard component for better mobile display
const AnalyticsCard = ({ title, value, trend }: { 
  title: string; 
  value: string; 
  trend?: number;
}) => (
  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-sm transition-all duration-300">
    <div className="space-y-1 sm:space-y-2">
      <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">{title}</p>
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg md:text-[28px] font-bold text-gray-900">{value}</h3>
        {trend !== undefined && (
          <p className={`text-[10px] sm:text-xs md:text-sm ${trend >= 0 ? 'text-[#4CAF50]' : 'text-red-500'}`}>
            • {trend > 0 ? '+' : ''}{trend}% dari bulan lalu
          </p>
        )}
      </div>
    </div>
  </div>
);

// Add this helper function for date formatting
const formatJoinDate = (date: string) => {
  try {
    return format(new Date(date), 'd MMMM yyyy', { locale: idLocale });
  } catch (error) {
    return '-';
  }
};

export default function StreamerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [rejectedBookings, setRejectedBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [streamerStats, setStreamerStats] = useState<StreamerStats | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<StreamerGalleryPhoto[]>([]);

  // Define fetchData first
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found");
        router.push("/sign-in");
        return;
      }

      // Get streamer data
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('id, user_id, first_name')
        .eq('user_id', user.id)
        .single();

      if (streamerError) {
        if (streamerError.code !== 'PGRST116') {
          throw streamerError;
        }
        return;
      }

      if (streamerData) {
        try {
          // Fetch additional streamer data
          const stats = await streamerService.getStreamerStats(streamerData.id);
          const gallery = await streamerService.getStreamerGallery(streamerData.id);
          
          setStreamerStats(stats);
          setGalleryPhotos(gallery);
          setUserData({ user_type: 'streamer', first_name: streamerData.first_name });

          // Fetch all bookings with different statuses
          const { data: allBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              *,
              client_first_name,
              client_last_name,
              sub_acc_link,
              sub_acc_pass
            `)
            .eq('streamer_id', streamerData.id)
            .order('start_time', { ascending: true });

          if (bookingsError) throw bookingsError;

          // Filter bookings based on status
          const upcomingBookings = (allBookings || []).filter(booking => 
            // Only show accepted and live bookings in upcoming schedule
            booking.status === 'accepted' || booking.status === 'live'
          );

          // Set pending bookings (including those that just completed payment)
          const pendingBookings = (allBookings || []).filter(booking => 
            booking.status === 'pending' || booking.status === 'payment_pending'
          );

          // Set rejected bookings
          const rejectedBookings = (allBookings || []).filter(booking => 
            booking.status === 'rejected'
          );

          // Update all states
          setBookings(upcomingBookings);
          setPendingBookings(pendingBookings);
          setRejectedBookings(rejectedBookings);

        } catch (err) {
          console.error("Error fetching streamer data:", err);
          throw err;
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Then define the handlers that depend on fetchData
  const handleStreamStart: StreamHandler = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleStreamEnd: StreamHandler = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const todayBookings = bookings.filter(booking => isToday(parseISO(booking.start_time)));
  const thisWeekBookings = bookings.filter(booking => 
    isThisWeek(parseISO(booking.start_time)) && !isToday(parseISO(booking.start_time))
  );
  const thisMonthBookings = bookings.filter(booking => 
    isThisMonth(parseISO(booking.start_time)) && !isThisWeek(parseISO(booking.start_time))
  );

  const renderScheduleCards = useCallback((bookings: Booking[]) => {
    const uniqueBookings = bookings.filter((booking, index, self) =>
      index === self.findIndex((b) => b.id === booking.id)
    );

    return uniqueBookings.map((booking) => (
      <ScheduleCard
        key={booking.id}
        booking={booking}
        onStreamStart={handleStreamStart}
        onStreamEnd={handleStreamEnd}
      />
    ));
  }, [handleStreamStart, handleStreamEnd]);

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const roundedDuration = Math.round(durationHours * 10) / 10; // Round to 1 decimal place
    return `${roundedDuration} ${roundedDuration === 1 ? 'Hour' : 'Hours'}`;
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscription
    const supabase = createClient();
    const subscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async (payload: any) => {
        console.log("Received real-time update:", payload);
        
        // Check if the new booking is for this streamer
        const { data: { user } } = await supabase.auth.getUser();
        const { data: streamerData } = await supabase
          .from('streamers')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (streamerData && payload.new && payload.new.streamer_id === streamerData.id) {
          // Handle different booking status changes
          if (payload.new.status === 'pending') {
            // New booking received - update pending bookings
            setPendingBookings(prev => [...prev, payload.new]);
            
            // Show notification
            const { data: clientData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', payload.new.client_id)
              .single();

            const clientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : 'A client';
            const bookingDate = payload.new.start_time ? 
              format(new Date(payload.new.start_time), 'MMMM d, yyyy') : 
              'Unknown date';
            const duration = payload.new.start_time && payload.new.end_time ? 
              calculateDuration(payload.new.start_time, payload.new.end_time) : 
              'Unknown duration';

            toast.info(`${clientName} has made a booking request for ${bookingDate} (${duration}).`, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } else if (payload.new.status === 'accepted') {
            // Booking accepted - move to upcoming schedule
            setPendingBookings(prev => prev.filter(b => b.id !== payload.new.id));
            setBookings(prev => [...prev, payload.new]);
          } else if (payload.new.status === 'rejected') {
            // Booking rejected - move to rejected list
            setPendingBookings(prev => prev.filter(b => b.id !== payload.new.id));
            setRejectedBookings(prev => [...prev, payload.new]);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const handleAcceptBooking = async (bookingId: number) => {
    const result = await acceptBooking(bookingId);
    if (result.success) {
      // Update local state immediately for better UX
      const acceptedBooking = pendingBookings.find(b => b.id === bookingId);
      if (acceptedBooking) {
        // Remove from pending
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        // Add to upcoming with accepted status
        setBookings(prev => [...prev, { ...acceptedBooking, status: 'accepted' }]);
      }
      toast.success("Booking accepted successfully");
      fetchData(); // Refresh all data
    } else {
      toast.error(result.error || "Failed to accept booking");
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    const result = await rejectBooking(bookingId);
    if (result.success) {
      // Update local state immediately for better UX
      const rejectedBooking = pendingBookings.find(b => b.id === bookingId);
      if (rejectedBooking) {
        // Remove from pending
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        // Add to rejected
        setRejectedBookings(prev => [...prev, { ...rejectedBooking, status: 'rejected' }]);
      }
      toast.success("Booking rejected successfully");
      fetchData(); // Refresh all data
    } else {
      toast.error(result.error || "Failed to reject booking");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <div>No user data available</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
        <ToastContainer />
        
        {/* Welcome Section - Better mobile spacing */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-lg sm:text-2xl md:text-[32px] font-bold mb-1 sm:mb-2">Dashboard Anda</h1>
          <div className="flex justify-between items-start">
            <div className="space-y-1 sm:space-y-2 md:space-y-4">
              <h2 className="text-xl sm:text-4xl md:text-[64px] font-bold leading-tight">
                HALO, {userData?.first_name?.toUpperCase()}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-[90%] sm:max-w-none">
                Selamat datang di dashboard Anda! Di sini Anda dapat memantau pendapatan, mengelola booking, dan melihat riwayat aktivitas Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Grid Layout - Improved mobile spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4 md:space-y-8">
            {/* Account Info Section */}
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg md:text-xl text-[#FF5733] mb-3 sm:mb-4">Informasi Akun</h3>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="flex justify-between items-center py-1.5 sm:py-2">
                  <span className="text-xs sm:text-sm md:text-base text-gray-600">Bergabung sejak</span>
                  <span className="text-xs sm:text-sm md:text-base text-gray-400">
                    {streamerStats?.joinDate ? formatJoinDate(streamerStats.joinDate) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 sm:py-2">
                  <span className="text-xs sm:text-sm md:text-base text-gray-600">Total jam live</span>
                  <span className="text-xs sm:text-sm md:text-base text-gray-400">
                    {streamerStats?.totalLiveHours 
                      ? `${Math.round(streamerStats.totalLiveHours)} jam`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 sm:py-2">
                  <span className="text-xs sm:text-sm md:text-base text-gray-600">Rating</span>
                  <span className="text-xs sm:text-sm md:text-base text-gray-400">
                    {streamerStats?.rating 
                      ? `${streamerStats.rating.toFixed(1)}/5.0`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg md:text-xl text-[#FF5733]">Galeri Live Terakhir</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {galleryPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img 
                      src={photo.photo_url}
                      alt={`Gallery image ${index + 1}`}
                      className="rounded-xl w-full h-full object-cover"
                    />
                  </div>
                ))}
                {(!galleryPhotos || galleryPhotos.length === 0) && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Belum ada foto
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4 md:space-y-8">
            {/* Analytics Cards - Better grid for mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
              <AnalyticsCard
                title="Total Pendapatan"
                value={streamerStats 
                  ? `Rp ${streamerStats.totalEarnings.toLocaleString('id-ID')}`
                  : '-'}
                trend={streamerStats?.trends.earnings}
              />
              <AnalyticsCard
                title="Total Booking"
                value={streamerStats?.totalBookings.toString() || '-'}
                trend={streamerStats?.trends.bookings}
              />
              <AnalyticsCard
                title="Total Live"
                value={streamerStats?.totalLive.toString() || '-'}
                trend={streamerStats?.trends.lives}
              />
              <AnalyticsCard
                title="Booking Dibatalkan"
                value={streamerStats?.cancelledBookings.toString() || '-'}
                trend={streamerStats?.trends.cancellations}
              />
            </div>

            {/* Action Buttons - Better mobile spacing */}
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <Button
                onClick={() => router.push('/streamer-schedule')}
                className="flex-1 py-2 sm:py-3 text-xs sm:text-sm bg-[#E23744] hover:bg-[#E23744]/90 text-white"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Atur Jadwal
              </Button>
              <Button
                onClick={() => router.push('/settings?type=streamer')}
                className="flex-1 py-2 sm:py-3 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Pengaturan
              </Button>
            </div>
          </div>
        </div>

        {/* Schedule Sections */}
        <div className="mt-3 sm:mt-4 md:mt-8 space-y-3 sm:space-y-4 md:space-y-8">
          {/* Upcoming Schedule Section */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Jadwal Live Mendatang</h2>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg mb-4 sm:mb-6">
                  <TabsTrigger 
                    value="today" 
                    className="text-xs sm:text-sm data-[state=active]:text-[#E23744] data-[state=active]:border-b-2 data-[state=active]:border-[#E23744]"
                  >
                    Hari Ini
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week"
                    className="text-xs sm:text-sm data-[state=active]:text-[#E23744] data-[state=active]:border-b-2 data-[state=active]:border-[#E23744]"
                  >
                    Minggu Ini
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month"
                    className="text-xs sm:text-sm data-[state=active]:text-[#E23744] data-[state=active]:border-b-2 data-[state=active]:border-[#E23744]"
                  >
                    Bulan Ini
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="space-y-4">
                  {todayBookings.length > 0 ? renderScheduleCards(todayBookings) : (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
                      Tidak ada booking untuk hari ini.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="week" className="space-y-4">
                  {thisWeekBookings.length > 0 ? renderScheduleCards(thisWeekBookings) : (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
                      Tidak ada booking untuk minggu ini.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="month" className="space-y-4">
                  {thisMonthBookings.length > 0 ? renderScheduleCards(thisMonthBookings) : (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
                      Tidak ada booking untuk bulan ini.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Booking Management Section */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Manajemen Booking</h2>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="flex space-x-2 p-1 bg-gray-50 rounded-xl mb-6">
                  <TabsTrigger 
                    value="pending" 
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E23744] data-[state=active]:shadow-sm"
                  >
                    Booking Menunggu ({pendingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rejected"
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E23744] data-[state=active]:shadow-sm"
                  >
                    Booking Dibatalkan ({rejectedBookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingBookings.length > 0 ? (
                    pendingBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onAccept={handleAcceptBooking}
                        onReject={handleRejectBooking}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
                      Tidak ada booking yang menunggu persetujuan
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                  {rejectedBookings.length > 0 ? (
                    rejectedBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onAccept={handleAcceptBooking}
                        onReject={handleRejectBooking}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg text-sm">
                      Tidak ada booking yang dibatalkan
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
