import { createClient } from "@/utils/supabase/client";
import { format } from 'date-fns';

// Simple type for notification types matching database exactly
export type NotificationType = 
  | 'info'
  | 'warning'
  | 'confirmation'
  | 'booking_request'
  | 'booking_payment'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'stream_started'
  | 'stream_ended'
  | 'reschedule_request'
  | 'reschedule_accepted'
  | 'reschedule_rejected'
  | 'item_received';

interface NotificationPayload {
  user_id?: string;
  streamer_id?: number;
  message: string;
  type: NotificationType;
  booking_id?: number;
  is_read: boolean;
}

export async function createNotification(payload: NotificationPayload) {
  const supabase = createClient();
  
  try {
    // Log the payload for debugging
    console.log('Creating notification with payload:', payload);

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...payload,
        created_at: new Date().toISOString(),
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log('Successfully created notification:', data);
    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
} 