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
import { Calendar, Clock, Monitor, DollarSign, MessageSquare, Link as LinkIcon, AlertTriangle, MapPin, Users, XCircle, Video, Settings, Loader2, Info } from 'lucide-react';
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
import { Textarea } from "@/components/ui/textarea";

interface UserData {
  user_type: string;
  first_name: string;
  user_id?: string;
  streamer_id?: number;
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
  timezone?: string;
  created_at: string;
  client?: {
    first_name: string;
    last_name: string;
    image_url: string;
  };
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

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose} // Close when clicking the backdrop
    >
      <div 
        className="bg-white rounded-xl w-full max-w-lg relative mx-4"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking the modal content
      >
        {/* X Button */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isConfirming}
        >
          <XCircle className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="pt-6 px-8 pb-4">
          <h2 className="text-2xl font-semibold text-center text-gray-900">
            Konfirmasi Penerimaan Barang
          </h2>
        </div>
        
        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Guidelines */}
          <div className="bg-red-50 rounded-xl p-6">
            <h4 className="text-red-800 font-semibold mb-4 text-lg">
              Panduan Penerimaan Barang:
            </h4>
            <ul className="list-disc pl-5 space-y-3 text-sm text-red-700">
              <li>Pastikan barang dalam kondisi baik dan sesuai dengan deskripsi</li>
              <li>Periksa kelengkapan dan kualitas setiap item</li>
              <li>Simpan foto kemasan dan isi paket sebagai dokumentasi</li>
            </ul>
          </div>

          {/* Warning Section */}
          <div className="bg-yellow-50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-2 text-base">Penting:</p>
                <p>Pastikan Anda telah menyimpan foto bukti penerimaan barang sebelum melanjutkan. Foto ini diperlukan untuk dokumentasi dan perlindungan Anda sebagai streamer.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with single button */}
        <div className="px-8 py-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleSubmit}
            disabled={isConfirming}
            className="w-full py-3 px-4 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : (
              'Konfirmasi Penerimaan'
            )}
          </button>
        </div>
      </div>
    </div>
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
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

// Add this before the ScheduleCard component
function StatusFlow({ status, itemsReceived }: { status: string; itemsReceived: boolean }) {
  const steps = [
    { label: 'Barang Diterima', completed: itemsReceived },
    { label: 'Start Live', completed: status === 'live' },
    { label: 'End Live', completed: status === 'completed' }
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={`step-${index}`} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            step.completed ? 'bg-blue-600' : 'bg-gray-300'
          }`} />
          <span className={`text-sm ${
            step.completed ? 'text-blue-600 font-medium' : 'text-gray-400'
          }`}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className={`h-px w-12 ${
              steps[index].completed && steps[index + 1].completed 
                ? 'bg-blue-600' 
                : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ScheduleCard({ booking, onStreamStart, onStreamEnd, setBookings }: ScheduleCardProps) {
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false);
  const [isLiveStreamModalOpen, setIsLiveStreamModalOpen] = useState(false);
  const [isItemAcceptanceModalOpen, setIsItemAcceptanceModalOpen] = useState(false);
  const [streamLink, setStreamLink] = useState(booking.stream_link || '');
  const [isStarting, setIsStarting] = useState(false);
  const [hasAcceptedItems, setHasAcceptedItems] = useState(booking.items_received || false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const handleStartLive = async () => {
    setIsStarting(true);
    try {
      // Optimistically update the UI
      const updatedBooking = { ...booking, status: 'live', stream_link: streamLink };
      setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
      setIsStartLiveModalOpen(false);
      setIsLiveStreamModalOpen(true);

      // Make the actual API call
      const result = await startStream(booking.id, streamLink);
      if (!result.success) {
        // Revert changes if the API call fails
        setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
        setIsLiveStreamModalOpen(false);
        setIsStartLiveModalOpen(true);
        toast.error(result.error || "Failed to start stream");
      } else {
        onStreamStart();
        toast.success("Live stream started successfully");
      }
    } catch (error) {
      // Revert changes if there's an error
      setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
      setIsLiveStreamModalOpen(false);
      setIsStartLiveModalOpen(true);
      toast.error("An error occurred while starting the stream");
    } finally {
      setIsStarting(false);
    }
  };

  // Remove duplicate handleStartLive function and keep other handlers
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
      }

      setHasAcceptedItems(true);
      setIsItemAcceptanceModalOpen(false);
      toast.success('Konfirmasi penerimaan barang berhasil');
    } catch (error) {
      console.error('Error confirming item acceptance:', error);
      toast.error('Gagal mengkonfirmasi penerimaan barang');
    }
  };

  const handleEndStream = async () => {
    try {
      const supabase = createClient();
      
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          stream_link: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (bookingError) {
        console.error('Booking update error:', bookingError);
        throw bookingError;
      }

      // Create notification for client
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: booking.client_id,
          message: `Stream session has ended.`,
          type: 'stream_complete',
          booking_id: booking.id,
          created_at: new Date().toISOString(),
          is_read: false
        }]);

      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      // Close modal and notify parent
      setIsLiveStreamModalOpen(false);
      onStreamEnd(); // This will trigger a refetch in the parent component
      toast.success("Stream ended successfully");

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
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden relative">
      {/* Live Indicator Tag */}
      {booking.status === 'live' && (
        <div className="absolute -right-8 top-4 bg-red-600 text-white px-8 py-1 transform rotate-45 z-10 shadow-lg">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
      )}

      {/* Stream Time Indicator */}
      {new Date(booking.start_time).getTime() - new Date().getTime() < 1000 * 60 * 30 && !booking.status.includes('completed') && (
        <div className="absolute left-0 top-0 w-full bg-yellow-50 text-yellow-800 px-4 py-3 text-sm border-b border-yellow-100">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {new Date(booking.start_time).getTime() > new Date().getTime() 
              ? "Stream akan dimulai dalam 30 menit"
              : "Stream seharusnya sudah dimulai"}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Existing dotted borders and cutouts */}
        <div className="absolute top-0 left-4 right-4 h-px border-t-2 border-dashed border-gray-200"></div>
        
        {/* Left circle cutout */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#faf9f6] rounded-full border border-gray-100"></div>
        
        {/* Right circle cutout */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#faf9f6] rounded-full border border-gray-100"></div>

        <div className="p-4 sm:p-6">
          <div className={`${new Date(booking.start_time).getTime() - new Date().getTime() < 1000 * 60 * 30 && !booking.status.includes('completed') ? 'pt-6' : ''}`}>
            {/* Status Flow */}
            <div className="mt-2 sm:mt-4 mb-6 sm:mb-8">
              <StatusFlow 
                status={booking.status} 
                itemsReceived={booking.items_received || false} 
              />
            </div>

            {/* Header - Client Name and Route */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {booking.client_first_name} {booking.client_last_name}
              </h3>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-500">{booking.platform}</span>
              </div>
            </div>

            {/* Time Section */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 px-2 sm:px-8">
              {/* Start Time */}
              <div className="text-left flex-1">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Start</div>
                <div className="text-xl sm:text-3xl font-bold text-gray-900">
                  {format(adjustToIndonesiaTime(booking.start_time), 'HH:mm')}
                </div>
              </div>

              {/* Duration Line with Logo */}
              <div className="flex-1 flex flex-col items-center px-2 sm:px-4">
                <Image
                  src="/images/salda-logoB.png"
                  alt="Salda"
                  width={80}
                  height={32}
                  className="mb-2 sm:mb-4 w-auto h-auto"
                />
                <div className="w-full flex items-center gap-2">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <div className="bg-gray-50 rounded-lg px-2 sm:px-4 py-1 text-xs sm:text-sm font-medium text-gray-600">
                    {differenceInHours(new Date(booking.end_time), new Date(booking.start_time))}h
                  </div>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
              </div>

              {/* End Time */}
              <div className="text-right flex-1">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">End</div>
                <div className="text-xl sm:text-3xl font-bold text-gray-900">
                  {format(adjustToIndonesiaTime(booking.end_time), 'HH:mm')}
                </div>
              </div>
            </div>

            {/* Price and Date Section */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Date</div>
                <div className="text-sm sm:text-base font-medium">
                  {format(adjustToIndonesiaTime(booking.start_time), 'MMMM d, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Price</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  Rp {booking.price.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Special Request Section */}
            {booking.special_request && (
              <div className="mb-4 sm:mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Special Request</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">{booking.special_request}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-dashed border-gray-200">
              {booking.status === 'live' ? (
                <button
                  onClick={() => setIsLiveStreamModalOpen(true)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                >
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white animate-pulse" />
                  View Live Stream
                </button>
              ) : booking.status === 'accepted' && (
                !hasAcceptedItems ? (
                  <button
                    onClick={() => setIsItemAcceptanceModalOpen(true)}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                  >
                    Barang Diterima
                  </button>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setIsRescheduleModalOpen(true)}
                      className="text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      reschedule
                    </button>
                    <button
                      onClick={() => setIsStartLiveModalOpen(true)}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                      Start Live
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Live Modal */}
      <Dialog open={isStartLiveModalOpen} onOpenChange={setIsStartLiveModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <div className="px-8 py-8 space-y-8">
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-bold">Start Live Stream</DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Pastikan semua persiapan telah selesai sebelum memulai live streaming.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-base font-medium">Stream Link</Label>
                <Input
                  placeholder="Masukkan link stream Anda"
                  value={streamLink}
                  onChange={(e) => setStreamLink(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <div className="bg-yellow-50 p-8 rounded-2xl text-base text-yellow-800">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-lg mb-4">Checklist Sebelum Live:</p>
                    <ul className="list-disc pl-5 space-y-3">
                      <li>Pastikan koneksi internet stabil</li>
                      <li>Periksa kembali barang yang akan di-review</li>
                      <li>Siapkan script atau poin-poin pembahasan</li>
                      <li>Test audio dan pencahayaan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setIsStartLiveModalOpen(false)}
                disabled={isStarting}
                className="px-8 py-6 text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartLive}
                disabled={!streamLink || isStarting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Stream'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keep other existing modals */}
      <LiveStreamModal
        isOpen={isLiveStreamModalOpen}
        onClose={() => setIsLiveStreamModalOpen(false)}
        booking={booking}
        streamLink={streamLink}
        onEndStream={handleEndStream}
      />

      <ItemAcceptanceModal
        isOpen={isItemAcceptanceModalOpen}
        onClose={() => setIsItemAcceptanceModalOpen(false)}
        onConfirm={handleItemAcceptance}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onConfirm={handleReschedule}
        booking={booking}
      />
    </div>
  );
}

function UpcomingSchedule({ bookings, onStreamStart, onStreamEnd, setBookings }: { 
  bookings: Booking[];
  onStreamStart: StreamHandler;
  onStreamEnd: StreamHandler;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}) {
  const todayBookings = bookings.filter(booking => isToday(parseISO(booking.start_time)));
  const thisWeekBookings = bookings.filter(booking => 
    isThisWeek(parseISO(booking.start_time)) && !isToday(parseISO(booking.start_time))
  );
  const thisMonthBookings = bookings.filter(booking => 
    isThisMonth(parseISO(booking.start_time)) && !isThisWeek(parseISO(booking.start_time))
  );

  // Update the ScheduleCard mapping to include type safety
  const renderScheduleCards = useCallback((bookings: Booking[]) => {
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
        setBookings={setBookings}
      />
    ));
  }, [onStreamStart, onStreamEnd, setBookings]);

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

// Add this new component for the rejection modal
function RejectionModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Konfirmasi Penolakan</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">Perhatian</span>
            </div>
            <p>Penolakan booking akan mempengaruhi performa dan reputasi Anda sebagai streamer.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
              Alasan Penolakan<span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="Mohon berikan alasan penolakan booking..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300"
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              'Konfirmasi Penolakan'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onAccept, onReject }: { 
  booking: Booking; 
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  const handleReject = async (reason: string) => {
    try {
      const supabase = createClient();
      
      // Update booking with rejection reason
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Call the reject handler
      onReject(booking.id);
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Gagal menolak booking');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="relative">
        {/* Top dotted border */}
        <div className="absolute top-0 left-4 right-4 h-px border-t-2 border-dashed border-gray-200"></div>
        
        {/* Left circle cutout */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#faf9f6] rounded-full border border-gray-100"></div>
        
        {/* Right circle cutout */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#faf9f6] rounded-full border border-gray-100"></div>

        <div className="p-6">
          {/* Header - Client Name and Route */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {booking.client_first_name} {booking.client_last_name}
            </h3>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{booking.platform}</span>
            </div>
          </div>

          {/* Time Section - Similar to Flight Times */}
          <div className="flex items-center justify-between mb-8">
            {/* Departure Time */}
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-500">Start</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {format(adjustToIndonesiaTime(booking.start_time), 'HH:mm')}
              </div>
            </div>

            {/* Duration Line with Logo */}
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="w-full flex flex-col items-center gap-1">
                <Image
                  src="/images/salda-icon.png"
                  alt="Salda"
                  width={80}
                  height={30}
                  className="mb-1"
                />
                <div className="w-full flex items-center gap-2">
                  <div className="h-px bg-gray-300 flex-1"></div>
                  <div className="bg-blue-50 rounded-lg px-3 py-1 text-sm font-medium text-blue-700">
                    {differenceInHours(new Date(booking.end_time), new Date(booking.start_time))}h
                  </div>
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>
              </div>
            </div>

            {/* Arrival Time */}
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-500">End</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {format(adjustToIndonesiaTime(booking.end_time), 'HH:mm')}
              </div>
            </div>
          </div>

          {/* Price and Date Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Date</div>
              <div className="font-medium">
                {format(adjustToIndonesiaTime(booking.start_time), 'MMMM d, yyyy')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Price</div>
              <div className="text-2xl font-bold text-blue-600">
                Rp {booking.price.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Special Request Section */}
          {booking.special_request && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Special Request</span>
              </div>
              <p className="text-sm text-gray-600">{booking.special_request}</p>
            </div>
          )}

          {/* Action Buttons */}
          {booking.status === 'pending' && (
            <div className="flex items-center justify-between pt-6 border-t border-dashed border-gray-200">
              <button
                onClick={() => setIsRejectionModalOpen(true)}
                className="text-sm text-red-600 hover:text-red-700 transition-colors font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept(booking.id)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Accept Session
              </button>
            </div>
          )}
        </div>
      </div>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleReject}
      />
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

function adjustToIndonesiaTime(dateString: string) {
  const date = new Date(dateString);
  // Subtract 8 hours to adjust for Indonesia timezone
  date.setHours(date.getHours() - 8);
  return date;
}

interface BookingEntryProps {
  booking: Booking;
  onStatusUpdate: (bookingId: number, newStatus: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'accepted': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'live': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

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

function BookingEntry({ booking, onStatusUpdate }: BookingEntryProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  return (
    <div className="border rounded-lg shadow-sm p-4 pb-4 mb-4 text-sm hover:shadow-md transition-shadow relative">
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
        <span className="text-gray-500 text-sm">
          {format(adjustToIndonesiaTime(booking.created_at), 'MMM d, yyyy HH:mm')}
        </span>
      </div>
      
      <div className="flex items-start mb-3 pb-3 border-b">
        <Image 
          src={booking.client?.image_url || '/default-avatar.png'}
          alt={`${booking.client?.first_name || 'Client'} ${booking.client?.last_name || ''}`}
          width={80}
          height={80}
          className="rounded-full mr-4"
        />
        <div className="flex-grow">
          <h3 className="font-medium text-base mb-2">
            {`${booking.client?.first_name || 'Client'} ${booking.client?.last_name || ''}`}
          </h3>
          <p className="text-gray-600 mb-2">Livestreaming services on {booking.platform}</p>
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-base">
              {`${format(adjustToIndonesiaTime(booking.start_time), 'HH:mm')} - ${format(adjustToIndonesiaTime(booking.end_time), 'HH:mm')}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStreamModal({ 
  isOpen, 
  onClose,
  booking,
  streamLink,
  onEndStream
}: { 
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  streamLink: string;
  onEndStream: () => void;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="h-6 w-6" />
        </button>

        <div className="p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center px-6 py-2.5 rounded-full bg-red-100 text-red-600">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse mr-3" />
              LIVE
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Live Streaming in Progress</h2>
          </div>

          {/* Timer */}
          <div className="text-center py-4">
            <div className="text-5xl font-mono font-bold text-gray-900 tracking-wider">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-base text-gray-500 mt-3">Elapsed Time</p>
          </div>

          {/* Stream Info */}
          <div className="space-y-6 bg-gray-50 rounded-2xl p-8">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Client</p>
              <p className="text-lg font-semibold">{booking.client_first_name} {booking.client_last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Platform</p>
              <p className="text-lg font-semibold">{booking.platform}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Stream Link</p>
              <a 
                href={streamLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all text-base"
              >
                {streamLink}
              </a>
            </div>
          </div>

          {/* End Stream Button */}
          <button
            onClick={onEndStream}
            className="w-full py-4 px-6 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            End Stream
          </button>
        </div>
      </div>
    </div>
  );
}

// Update the IDCard component for better mobile responsiveness
function IDCard({ userId, streamerId, firstName, stats, joinDate, rating, galleryPhotos, router }: { 
  userId: string;
  streamerId: number;
  firstName: string;
  stats: StreamerStats;
  joinDate: string;
  rating: number;
  galleryPhotos: StreamerGalleryPhoto[];
  router: any;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Left Column - Info */}
          <div className="flex-1 space-y-4 lg:space-y-6 lg:border-r lg:border-gray-100 lg:pr-12">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{firstName}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Joined {format(new Date(joinDate), 'MMMM d, yyyy')}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">User ID:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono truncate max-w-[150px] sm:max-w-none">{userId}</code>
                    <button
                      onClick={() => copyToClipboard(userId, 'user')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedId === 'user' ? (
                        <span className="text-green-500 text-xs">Copied!</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Streamer ID:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono">{streamerId}</code>
                    <button
                      onClick={() => copyToClipboard(streamerId.toString(), 'streamer')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedId === 'streamer' ? (
                        <span className="text-green-500 text-xs">Copied!</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500">Rating</p>
                <p className="text-base sm:text-lg font-semibold mt-1">{rating.toFixed(1)}/5.0</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500">Total Hours</p>
                <p className="text-base sm:text-lg font-semibold mt-1">{Math.round(stats.totalLiveHours)} hrs</p>
              </div>
            </div>
          </div>

          {/* Right Column - Gallery and Buttons */}
          <div className="w-full lg:w-[400px] lg:pl-12">
            {/* Gallery Section */}
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Galeri Live Terakhir</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                  <div className="col-span-full text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
                    Belum ada foto
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Centered with visual separation */}
            <div className="my-4 sm:my-6 py-4 sm:py-6 border-y border-gray-100">
              <div className="flex justify-center gap-2 sm:gap-3">
                <Button
                  onClick={() => router.push('/streamer-schedule')}
                  className="w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-xl bg-[#E23744] hover:bg-[#E23744]/90 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  title="Atur Jadwal"
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  onClick={() => router.push('/settings?type=streamer')}
                  className="w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                  title="Pengaturan"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ${
                    isExpanded ? 'bg-gray-200' : ''
                  }`}
                  title="Lihat Analytics"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Analytics Section */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 sm:p-6 pt-0 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <AnalyticsCard
              title="Total Pendapatan"
              value={`Rp ${stats.totalEarnings.toLocaleString('id-ID')}`}
              trend={stats.trends.earnings}
            />
            <AnalyticsCard
              title="Total Booking"
              value={stats.totalBookings.toString()}
              trend={stats.trends.bookings}
            />
            <AnalyticsCard
              title="Total Live"
              value={stats.totalLive.toString()}
              trend={stats.trends.lives}
            />
            <AnalyticsCard
              title="Booking Dibatalkan"
              value={stats.cancelledBookings.toString()}
              trend={stats.trends.cancellations}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StreamerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [rejectedBookings, setRejectedBookings] = useState<Booking[]>([]);
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
          setUserData({ 
            user_type: 'streamer', 
            first_name: streamerData.first_name,
            user_id: user.id,
            streamer_id: streamerData.id
          });

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
    // Filter out duplicate bookings based on booking ID
    const uniqueBookings = bookings.filter((booking, index, self) =>
      index === self.findIndex((b) => b.id === booking.id)
    );

    return uniqueBookings.map((booking) => (
      <ScheduleCard
        key={booking.id}
        booking={booking}
        onStreamStart={handleStreamStart}
        onStreamEnd={handleStreamEnd}
        setBookings={setBookings}
      />
    ));
  }, [handleStreamStart, handleStreamEnd, setBookings]);

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

  const formatDateString = (dateString: string) => {
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
      // Find the booking to be accepted
      const acceptedBooking = pendingBookings.find(b => b.id === bookingId);
      if (acceptedBooking) {
        // Update states immediately
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        setBookings(prev => [...prev, { ...acceptedBooking, status: 'accepted' }]);
        toast.success("Booking accepted successfully");
      }
    } else {
      toast.error(result.error || "Failed to accept booking");
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    const result = await rejectBooking(bookingId);
    if (result.success) {
      // Find the booking to be rejected
      const rejectedBooking = pendingBookings.find(b => b.id === bookingId);
      if (rejectedBooking) {
        // Update states immediately
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        setRejectedBookings(prev => [...prev, { ...rejectedBooking, status: 'rejected' }]);
        toast.success("Booking rejected successfully");
      }
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
    <div className="min-h-screen bg-[#faf9f6]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
        <ToastContainer />
        
        {/* ID Card */}
        {userData && streamerStats && (
          <IDCard
            userId={userData.user_id!}
            streamerId={userData.streamer_id!}
            firstName={userData.first_name}
            stats={streamerStats}
            joinDate={streamerStats.joinDate}
            rating={streamerStats.rating}
            galleryPhotos={galleryPhotos}
            router={router}
          />
        )}

        {/* Schedule Sections */}
        <div className="mt-8 space-y-8">
          {/* Upcoming Schedule Section */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Jadwal Live Mendatang</h2>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg mb-6">
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Manajemen Booking</h2>
            </div>
            <div className="p-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="flex space-x-2 p-1 bg-gray-50 rounded-xl mb-6">
                  <TabsTrigger 
                    value="pending" 
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    Booking Menunggu ({pendingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rejected"
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    Booking Dibatalkan ({rejectedBookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingBookings.length > 0 ? (
                    [...pendingBookings]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((booking) => (
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
                    [...rejectedBookings]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((booking) => (
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
