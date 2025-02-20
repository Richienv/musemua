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

    // Get the payment group ID from the order ID
    const paymentGroupId = payload.order_id.split('-')[1];
    if (!paymentGroupId) {
      throw new Error('Invalid order ID format');
    }

    // Fetch all bookings under this payment group
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name)')
      .eq('payment_group_id', paymentGroupId);

    if (bookingError) throw bookingError;
    if (!bookings || bookings.length === 0) throw new Error('No bookings found for this payment group');

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: payload.transaction_status,
        midtrans_response: payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentGroupId);

    if (updateError) throw updateError;

    // If payment is successful, create notifications for each booking
    if (payload.transaction_status === 'settlement') {
      for (const booking of bookings) {
        // Notification for client
        await createNotification({
          user_id: booking.client_id,
          streamer_id: booking.streamer_id,
          message: `Payment confirmed for your booking with ${booking.streamers.first_name} on ${format(new Date(booking.start_time), 'dd MMMM HH:mm')}.`,
          type: 'booking_payment',
          booking_id: booking.id,
          is_read: false
        });

        // Notification for streamer
        await createNotification({
          streamer_id: booking.streamer_id,
          message: `New booking payment received from ${booking.client_first_name} for ${format(new Date(booking.start_time), 'dd MMMM HH:mm')}.`,
          type: 'booking_payment',
          booking_id: booking.id,
          is_read: false
        });
      }
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