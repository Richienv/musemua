import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/services/notification-service";
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const payload = await request.json();

    // Validate the payment notification
    if (!payload.transaction_status || !payload.order_id) {
      throw new Error('Invalid payment notification payload');
    }

    // Get the booking ID from the order ID
    const bookingId = payload.order_id.split('-')[1];
    if (!bookingId) {
      throw new Error('Invalid order ID format');
    }

    // Fetch the booking data
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;
    if (!bookingData) throw new Error('Booking not found');

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: payload.transaction_status,
        midtrans_response: payload,
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId);

    if (updateError) throw updateError;

    // If payment is successful, create notifications
    if (payload.transaction_status === 'settlement') {
      // Notification for client
      await createNotification({
        user_id: bookingData.client_id,
        streamer_id: bookingData.streamer_id,
        message: `Payment confirmed for your booking with ${bookingData.streamers.first_name} ${bookingData.streamers.last_name} on ${format(new Date(bookingData.start_time), 'dd MMMM HH:mm')}.`,
        type: 'booking_payment',
        booking_id: parseInt(bookingId),
        is_read: false
      });

      // Notification for streamer
      await createNotification({
        streamer_id: bookingData.streamer_id,
        message: `New booking payment received from ${bookingData.client_first_name} ${bookingData.client_last_name} for ${format(new Date(bookingData.start_time), 'dd MMMM HH:mm')}.`,
        type: 'booking_payment',
        booking_id: parseInt(bookingId),
        is_read: false
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment webhook: ' + (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
} 