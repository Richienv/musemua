"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { format } from 'date-fns';

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
  type: 'confirmation' | 'info' | 'warning' | 'booking_request' | 'stream_started' | 'stream_ended' | 'reschedule_request';
  is_read: boolean;
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
          bookings (*)
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
        <Button variant="ghost" size="icon" className="relative w-10 h-10" onClick={() => {
          setIsOpen(true);
          fetchNotifications();
        }}>
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No new notifications</p>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b border-gray-200 transition-colors duration-150 ease-in-out
                    ${!notification.is_read ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  onClick={() => handleNotificationSeen(notification.id)}
                >
                  <h4 className={`font-semibold text-sm mb-1 ${
                    notification.type === 'reschedule_request' ? 'text-orange-800' : 'text-blue-800'
                  }`}>
                    {notification.type === 'confirmation' ? 'Booking Confirmation' : 
                     notification.type === 'reschedule_request' ? 'Pengajuan Reschedule' :
                     notification.type === 'info' && notification.message.includes('has booked your services') ? 'New Booking Request' :
                     notification.type === 'info' ? 'Information' : 
                     notification.type === 'warning' ? 'Warning' : 
                     notification.type === 'stream_started' ? 'Stream Started' :
                     notification.type === 'stream_ended' ? 'Stream Ended' :
                     'Notification'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}