"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { type NotificationType, markAllNotificationsAsRead, markNotificationAsRead } from '@/services/notification-service';

// Add these utility functions
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

interface Notification {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  type: NotificationType;
  is_read: boolean;
  metadata?: Record<string, any>;
  booking_id?: number;
  streamer_id?: number;
}

interface NotificationGroup {
  title: string;
  notifications: Notification[];
}

interface UserData {
  id: string;
  user_type: 'streamer' | 'client';
  streamer_id?: number;
}

export function NotificationsPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState<'streamer' | 'client' | null>(null);
  const supabase = createClient();

  const groupNotifications = (notifications: Notification[]): NotificationGroup[] => {
    const groups: NotificationGroup[] = [];
    const now = new Date();

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      let group: NotificationGroup;

      if (isToday(date)) {
        group = groups.find(g => g.title === 'Hari Ini') || { title: 'Hari Ini', notifications: [] };
      } else if (isYesterday(date)) {
        group = groups.find(g => g.title === 'Kemarin') || { title: 'Kemarin', notifications: [] };
      } else if (isThisWeek(date)) {
        group = groups.find(g => g.title === 'Minggu Ini') || { title: 'Minggu Ini', notifications: [] };
      } else if (isThisMonth(date)) {
        group = groups.find(g => g.title === 'Bulan Ini') || { title: 'Bulan Ini', notifications: [] };
      } else {
        group = groups.find(g => g.title === 'Sebelumnya') || { title: 'Sebelumnya', notifications: [] };
      }

      if (!groups.includes(group)) {
        groups.push(group);
      }
      group.notifications.push(notification);
    });

    return groups;
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking_request':
        return '📅';
      case 'booking_payment':
        return '💰';
      case 'booking_accepted':
        return '✅';
      case 'booking_rejected':
        return '❌';
      case 'booking_cancelled':
        return '🚫';
      case 'stream_started':
        return '🎥';
      case 'stream_ended':
        return '🏁';
      case 'reschedule_request':
        return '🔄';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'confirmation':
        return '✓';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationTitle = (type: NotificationType): string => {
    switch (type) {
      case 'booking_request':
        return 'Permintaan Booking';
      case 'booking_payment':
        return 'Konfirmasi Pembayaran';
      case 'booking_accepted':
        return 'Booking Diterima';
      case 'booking_rejected':
        return 'Booking Ditolak';
      case 'booking_cancelled':
        return 'Booking Dibatalkan';
      case 'stream_started':
        return 'Live Stream Dimulai';
      case 'stream_ended':
        return 'Live Stream Selesai';
      case 'reschedule_request':
        return 'Permintaan Reschedule';
      case 'reschedule_accepted':
        return 'Reschedule Diterima';
      case 'reschedule_rejected':
        return 'Reschedule Ditolak';
      case 'info':
        return 'Informasi';
      case 'warning':
        return 'Peringatan';
      case 'confirmation':
        return 'Konfirmasi';
      default:
        return 'Pemberitahuan';
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await markAllNotificationsAsRead(user.id);
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // First get user type and data
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (!userData) {
        console.error('User data not found');
        return;
      }

      setUserType(userData.user_type);

      let notificationsQuery = supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          streamer_id,
          message,
          type,
          created_at,
          is_read,
          booking_id,
          bookings (
            id,
            client_id,
            streamer_id,
            start_time,
            end_time,
            platform,
            client_first_name,
            client_last_name,
            streamer:streamers (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (userData.user_type === 'streamer') {
        // Get streamer_id first
        const { data: streamerData } = await supabase
          .from('streamers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (streamerData) {
          // Use proper OR condition for streamer notifications
          notificationsQuery = notificationsQuery
            .or(`streamer_id.eq.${streamerData.id}`);
        }
      } else {
        // Client notifications
        notificationsQuery = notificationsQuery.eq('user_id', user.id);
      }

      const { data: notifications, error } = await notificationsQuery;

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      console.log('Fetched notifications:', notifications);
      
      const processedNotifications = notifications?.map(notification => ({
        ...notification,
        message: formatNotificationMessage(notification, userData.user_type)
      })) || [];

      setNotifications(processedNotifications);
      setUnreadCount(processedNotifications.filter(n => !n.is_read).length);

    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  }, [supabase]);

  // New helper function to format notification messages
  const formatNotificationMessage = (notification: any, userType: string): string => {
    if (!notification) return '';

    if (notification.bookings) {
      const booking = notification.bookings;
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      const duration = calculateDuration(startTime, endTime);
      
      switch (notification.type) {
        case 'booking_request':
          return `${booking.client_first_name} ${booking.client_last_name} has booked your services for ${format(startTime, 'dd MMMM HH:mm')} - ${format(endTime, 'HH:mm')} (${duration} hours)`;
        case 'booking_payment':
          return `Payment confirmed for booking with ${booking.client_first_name} ${booking.client_last_name} (${format(startTime, 'dd MMMM')})`;
        case 'booking_cancelled':
          return `Booking cancelled by ${booking.client_first_name} ${booking.client_last_name} for ${format(startTime, 'dd MMMM')}`;
        case 'stream_started':
          return userType === 'client' 
            ? `${booking.streamer_first_name} ${booking.streamer_last_name} telah memulai live stream untuk booking Anda pada ${format(startTime, 'dd MMMM HH:mm')}. Klik untuk bergabung.`
            : `Anda telah memulai live stream dengan ${booking.client_first_name} ${booking.client_last_name}`;
        case 'stream_ended':
          return userType === 'client'
            ? `${booking.streamer_first_name} ${booking.streamer_last_name} telah mengakhiri live stream untuk booking Anda.`
            : `Anda telah mengakhiri live stream dengan ${booking.client_first_name} ${booking.client_last_name}`;
        case 'reschedule_request':
          return userType === 'client' 
            ? `Streamer ${booking.streamer_first_name} ${booking.streamer_last_name} mengajukan perubahan jadwal untuk sesi live streaming Anda.`
            : `Anda mengajukan perubahan jadwal untuk sesi dengan ${booking.client_first_name} ${booking.client_last_name}`;
        default:
          return notification.message;
      }
    }

    return notification.message;
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('New notification:', payload);
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleNotificationSeen = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      await fetchNotifications();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative w-12 sm:w-14 h-12 sm:h-14 hover:bg-gray-100 transition-colors" 
          onClick={() => {
            setIsOpen(true);
            fetchNotifications();
          }}
        >
          <Bell className="h-6 sm:h-7 w-6 sm:w-7" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 sm:right-3 min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-32px)] sm:w-96 p-0" 
        align="end" 
        sideOffset={8}
      >
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg font-semibold">Notifikasi</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-6 text-gray-500">Tidak ada notifikasi baru</p>
            ) : (
              groupNotifications(notifications).map((group) => (
                <div key={group.title}>
                  <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
                    {group.title}
                  </div>
                  {group.notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50 cursor-pointer
                        ${!notification.is_read ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificationSeen(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {getNotificationTitle(notification.type)}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}