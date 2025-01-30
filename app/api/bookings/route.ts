import { createClient } from "@/utils/supabase/server";
import { createNotification } from '@/services/notification-service';

export async function POST(req: Request) {
  const supabase = createClient();
  const bookingData = await req.json();

  try {
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        streamer:streamers (
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response('Error creating booking', { status: 500 });
    }

    // Create initial notifications
    try {
      // Create notification for streamer
      await createNotification({
        streamer_id: booking.streamer_id,
        message: `${booking.client_first_name} ${booking.client_last_name} wants to book your services`,
        type: 'booking_request',
        booking_id: booking.id,
        is_read: false
      });

      // Create notification for client
      await createNotification({
        user_id: booking.client_id,
        message: `Booking request sent to ${booking.streamer.first_name} ${booking.streamer.last_name}. Please complete payment.`,
        type: 'booking_request',
        booking_id: booking.id,
        is_read: false
      });

    } catch (notifError) {
      console.error('Error in notification creation:', notifError);
    }

    return new Response(JSON.stringify(booking), { status: 200 });
  } catch (error) {
    console.error('Error in booking creation:', error);
    return new Response('Error creating booking', { status: 500 });
  }
} 