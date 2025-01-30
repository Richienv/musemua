import { createClient } from "@/utils/supabase/client";
import { format } from 'date-fns';

interface NotificationData {
  user_id?: string | null;
  streamer_id?: number | null;
  message: string;
  type: 'booking_request' | 'booking_payment' | 'booking_cancelled' | 'booking_accepted' | 'booking_rejected' | 'confirmation';
  booking_id: number;
}

export async function createNotification(data: NotificationData) {
  const supabase = createClient();
  
  try {
    console.log('Creating notification:', data);
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log('Notification created:', notification);
    return notification;
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
}

export async function createBookingNotifications(booking: any, type: string) {
  try {
    console.log('Creating booking notifications for:', { booking, type });
    
    const supabase = createClient();
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('first_name, last_name, user_id')
      .eq('id', booking.streamer_id)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer data:', streamerError);
      throw streamerError;
    }

    const notifications: NotificationData[] = [];

    switch (type) {
      case 'initial_booking':
        notifications.push(
          {
            streamer_id: booking.streamer_id,
            message: `${booking.client_first_name} ${booking.client_last_name} wants to book your services for ${format(new Date(booking.start_time), 'dd MMMM HH:mm')} - ${format(new Date(booking.end_time), 'HH:mm')}`,
            type: 'booking_request',
            booking_id: booking.id
          },
          {
            user_id: booking.client_id,
            message: `Booking request sent to ${streamerData.first_name} ${streamerData.last_name}. Waiting for confirmation.`,
            type: 'booking_request',
            booking_id: booking.id
          }
        );
        break;

      case 'payment_success':
        notifications.push(
          {
            streamer_id: booking.streamer_id,
            message: `New booking request from ${booking.client_first_name} ${booking.client_last_name}. Payment confirmed.`,
            type: 'booking_payment',
            booking_id: booking.id
          },
          {
            user_id: booking.client_id,
            message: `Payment confirmed. Waiting for ${streamerData.first_name} ${streamerData.last_name} to accept your booking.`,
            type: 'booking_payment',
            booking_id: booking.id
          }
        );
        break;

      case 'booking_accepted':
        notifications.push(
          {
            user_id: booking.client_id,
            message: `${streamerData.first_name} ${streamerData.last_name} has accepted your booking for ${format(new Date(booking.start_time), 'dd MMMM HH:mm')}`,
            type: 'confirmation',
            booking_id: booking.id
          }
        );
        break;

      case 'booking_rejected':
        notifications.push(
          {
            user_id: booking.client_id,
            message: `Your booking for ${format(new Date(booking.start_time), 'dd MMMM HH:mm')} has been rejected.`,
            type: 'booking_rejected',
            booking_id: booking.id
          }
        );
        break;

      case 'booking_cancelled':
        // Notify both parties
        notifications.push(
          {
            streamer_id: booking.streamer_id,
            message: `Booking cancelled by ${booking.client_first_name} ${booking.client_last_name}`,
            type: 'booking_cancelled',
            booking_id: booking.id
          },
          {
            user_id: booking.client_id,
            message: `Your booking with ${streamerData.first_name} ${streamerData.last_name} has been cancelled`,
            type: 'booking_cancelled',
            booking_id: booking.id
          }
        );
        break;
    }

    // Create all notifications
    for (const notif of notifications) {
      await createNotification(notif);
    }

    console.log('Successfully created all notifications');
  } catch (error) {
    console.error('Error in createBookingNotifications:', error);
    throw error;
  }
} 