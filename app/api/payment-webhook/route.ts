import { createClient } from "@/utils/supabase/server";
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createClient();
  
  // Add webhook request logging
  console.log('=== WEBHOOK REQUEST START ===');
  console.log('Headers:', Object.fromEntries(req.headers));
  const body = await req.json();
  console.log('Raw Body:', body);
  console.log('=== WEBHOOK REQUEST END ===');

  console.log('===============================');
  console.log('Payment Webhook Called');
  console.log('Body:', body);
  console.log('===============================');

  try {
    const { 
      transaction_status: paymentStatus,
      order_id,
      transaction_id
    } = body;

    console.log('Payment Status:', paymentStatus);
    console.log('Order ID:', order_id);

    // Extract booking ID from order_id
    const bookingId = order_id.split('_')[1];
    
    // Get booking details with streamer info
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        streamer:streamers (
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      console.error('Booking not found:', bookingId);
      return new Response('Booking not found', { status: 404 });
    }

    console.log('Found booking:', booking);

    if (paymentStatus === 'settlement' || paymentStatus === 'capture') {
      console.log('Processing successful payment...');

      // First update payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_status: paymentStatus,
          transaction_id,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      // Then update booking status
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      // Create notifications for both parties
      const notifications = [
        {
          streamer_id: booking.streamer_id,
          message: `Payment received for booking with ${booking.client_first_name} ${booking.client_last_name}`,
          type: 'booking_payment',
          booking_id: booking.id,
          created_at: new Date().toISOString(),
          is_read: false
        },
        {
          user_id: booking.client_id,
          message: `Payment confirmed for your booking with ${booking.streamer.first_name} ${booking.streamer.last_name}`,
          type: 'booking_payment',
          booking_id: booking.id,
          created_at: new Date().toISOString(),
          is_read: false
        }
      ];

      // Insert notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
      } else {
        console.log('Successfully created notifications');
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
} 