"use client";

import { useEffect, useState } from 'react';
import { Bell, ArrowLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { type NotificationType } from '@/services/notification-service';

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking_request': return '📅';
      case 'booking_payment': return '💰';
      case 'booking_accepted': return '✅';
      case 'booking_rejected': return '❌';
      case 'booking_cancelled': return '🚫';
      case 'stream_started': return '🎥';
      case 'stream_ended': return '🏁';
      case 'reschedule_request': return '🔄';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'confirmation': return '✓';
      case 'new_message': return '💬';
      default: return 'ℹ️';
    }
  };

  const getNotificationTitle = (type: NotificationType): string => {
    switch (type) {
      case 'booking_request': return 'Permintaan Booking';
      case 'booking_payment': return 'Konfirmasi Pembayaran';
      case 'booking_accepted': return 'Booking Diterima';
      case 'booking_rejected': return 'Booking Ditolak';
      case 'booking_cancelled': return 'Booking Dibatalkan';
      case 'stream_started': return 'Live Stream Dimulai';
      case 'stream_ended': return 'Live Stream Selesai';
      case 'reschedule_request': return 'Permintaan Reschedule';
      case 'new_message': return 'Pesan Baru';
      case 'info': return 'Informasi';
      case 'warning': return 'Peringatan';
      case 'confirmation': return 'Konfirmasi';
      default: return 'Pemberitahuan';
    }
  };

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

  const handleNotificationSeen = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('id, user_id')
        .eq('id', id)
        .single();

      if (fetchError || !notification) {
        console.error('Error fetching notification:', fetchError);
        return;
      }

      const { error } = await supabase.rpc('mark_notification_as_read', {
        notification_id: id,
        user_identifier: user.id
      });

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error in handleNotificationSeen:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        user_identifier: user.id
      });

      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error in handleMarkAllAsRead:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (userData.user_type === 'streamer') {
        const { data: streamerData } = await supabase
          .from('streamers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (streamerData) {
          query = query.or(`streamer_id.eq.${streamerData.id},user_id.eq.${user.id}`);
        }
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(notifications || []);
      setUnreadCount(notifications?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
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
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Notifikasi</h1>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-sm text-gray-600"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Tandai Dibaca
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="pt-14 pb-safe">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-center">Tidak ada notifikasi baru</p>
          </div>
        ) : (
          groupNotifications(notifications).map((group) => (
            <div key={group.title} className="mb-2">
              <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 sticky top-14 z-10">
                {group.title}
              </div>
              {group.notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b border-gray-100 active:bg-gray-50
                    ${!notification.is_read ? 'bg-blue-50/60' : ''}`}
                  onClick={() => handleNotificationSeen(notification.id)}
                >
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {getNotificationTitle(notification.type)}
                        </h4>
                        <time className="text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(notification.created_at), 'HH:mm', { locale: id })}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(notification.created_at), 'dd MMM yyyy', { locale: id })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 