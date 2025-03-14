import { createClient } from "@/utils/supabase/client";
import midtransClient from 'midtrans-client';
import { createNotification, type NotificationType } from '@/services/notification-service';
import { format } from 'date-fns';
import crypto from 'crypto';

// Initialize Snap client with proper error handling
const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
});

export interface PaymentMetadata {
  streamerId: string;
  userId: string;
  bookings: Array<{
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    timeRanges: Array<{
      start: string;
      end: string;
      duration: number;
    }>;
  }>;
  timezone: string;
  platform: string;
  specialRequest: string;
  sub_acc_link: string;
  sub_acc_pass: string;
  firstName: string;
  lastName: string;
  price: number;
  totalHours: number;
  totalPrice: number;
  voucher: {
    id: string;
    code: string;
    discountAmount: number;
  } | null;
  finalPrice: number;
}

interface PaymentDetails {
  amount: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  description: string;
  metadata: PaymentMetadata;
}

export async function createPayment(details: PaymentDetails) {
  try {
    // Validate environment variables
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
      throw new Error('Midtrans configuration is missing');
    }

    console.log('=== Create Payment Start ===');
    console.log('Payment details:', details);

    // Generate a proper order ID format
    const orderId = `BOOKING-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log('Generated order ID:', orderId);
    
    // Get site URL with fallback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Generate Midtrans token
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: details.metadata.finalPrice
      },
      customer_details: {
        first_name: details.clientName,
        email: details.clientEmail,
        phone: details.clientPhone || ''
      },
      credit_card: {
        secure: true
      },
      callbacks: {
        finish: `${siteUrl}/client-bookings`
      }
    };

    console.log('Transaction details for Midtrans:', transactionDetails);

    const transaction = await snap.createTransaction(transactionDetails);
    console.log('Midtrans response:', transaction);

    if (!transaction || !transaction.token) {
      console.error('No token in Midtrans response');
      throw new Error('Failed to generate Midtrans token');
    }

    console.log('=== Create Payment Complete ===');

    return {
      token: transaction.token,
      metadata: details.metadata,
      orderId: orderId
    };
  } catch (error) {
    console.error('=== Create Payment Error ===');
    console.error('Error details:', error);
    throw error;
  }
}

interface BookingResponse {
  id: number;
  client_id: string;
  client_first_name: string;
  client_last_name: string;
}

export async function createBookingAfterPayment(
  result: any, 
  metadata: PaymentMetadata
): Promise<BookingResponse[]> {
  const supabase = createClient();
  
  try {
    console.log('=== Debug: Creating Booking After Payment ===');
    console.log('Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('Client timezone from metadata:', metadata.timezone);
    console.log('Raw Result:', JSON.stringify(result, null, 2));
    console.log('Raw Metadata:', JSON.stringify(metadata, null, 2));
    
    const transactionId = result.order_id || result.transaction_id;
    if (!transactionId) {
      throw new Error('Missing transaction ID in payment result');
    }

    // Create bookings array with proper time blocks
    console.log('=== Processing Bookings ===');
    const bookingInserts = metadata.bookings.map(booking => {
      console.log('Processing booking:', JSON.stringify(booking, null, 2));
      console.log('Time ranges from metadata:', JSON.stringify(booking.timeRanges, null, 2));
      
      // If no timeRanges, create a single booking
      const timeBlocks = booking.timeRanges?.length ? booking.timeRanges : [{
        start: booking.startTime.split('T')[1] || booking.startTime,
        end: booking.endTime.split('T')[1] || booking.endTime,
        duration: booking.hours
      }];
      
      console.log('Generated time blocks:', JSON.stringify(timeBlocks, null, 2));

      // Create a booking for each time block
      return timeBlocks.map(block => {
        // Extract time parts correctly, handling both full ISO strings and time-only strings
        const startTimePart = block.start.includes('T') ? block.start.split('T')[1] : block.start;
        const endTimePart = block.end.includes('T') ? block.end.split('T')[1] : block.end;
        
        console.log('Date from booking:', booking.date);
        console.log('Start time part:', startTimePart);
        console.log('End time part:', endTimePart);
        
        // Create the full ISO string by combining date and time
        const startTimeStr = `${booking.date}T${startTimePart}`;
        const endTimeStr = `${booking.date}T${endTimePart}`;
        
        console.log('Combined start time string:', startTimeStr);
        console.log('Combined end time string:', endTimeStr);
        
        // Parse the dates
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        
        console.log('Parsed start time:');
        console.log('- ISO:', startTime.toISOString());
        console.log('- UTC:', startTime.toUTCString());
        console.log('- Local:', startTime.toString());
        console.log('- Hours (local):', startTime.getHours());
        console.log('- Hours (UTC):', startTime.getUTCHours());
        
        console.log('Parsed end time:');
        console.log('- ISO:', endTime.toISOString());
        console.log('- UTC:', endTime.toUTCString());
        console.log('- Local:', endTime.toString());
        console.log('- Hours (local):', endTime.getHours());
        console.log('- Hours (UTC):', endTime.getUTCHours());
        
        // Calculate duration
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        console.log('Calculated duration (hours):', durationHours);
        
        // Store the times in UTC format without any manual adjustments
        const bookingData = {
          client_id: metadata.userId,
          streamer_id: parseInt(metadata.streamerId),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          platform: metadata.platform,
          status: 'pending',
          special_request: metadata.specialRequest || null,
          sub_acc_link: metadata.sub_acc_link || null,
          sub_acc_pass: metadata.sub_acc_pass || null,
          price: Math.round(metadata.finalPrice / metadata.bookings.length / (timeBlocks.length || 1)),
          client_first_name: metadata.firstName,
          client_last_name: metadata.lastName,
          timezone: metadata.timezone, // Store the original timezone
          stream_link: null,
          items_received: false,
          items_received_at: null,
          reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Created booking data:', JSON.stringify(bookingData, null, 2));
        // Log what time this booking will look like in the client's timezone
        console.log('How this booking will appear to the client:');
        try {
          const clientStartTime = new Date(bookingData.start_time);
          const clientEndTime = new Date(bookingData.end_time);
          console.log(`Start: ${clientStartTime.toLocaleString('en-US', { timeZone: metadata.timezone })}`);
          console.log(`End: ${clientEndTime.toLocaleString('en-US', { timeZone: metadata.timezone })}`);
        } catch (error) {
          console.error('Error calculating client-facing times:', error);
        }
        
        return bookingData;
      });
    }).flat();

    console.log('=== Final Booking Data ===');
    console.log('Number of bookings to create:', bookingInserts.length);
    console.log('Final booking inserts:', JSON.stringify(bookingInserts, null, 2));

    // Insert all bookings first
    const { data: newBookings, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingInserts)
      .select();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw bookingError;
    }

    if (!newBookings || newBookings.length === 0) {
      console.error('No bookings were created');
      throw new Error('Failed to create bookings');
    }

    console.log('Successfully created bookings:', JSON.stringify(newBookings, null, 2));

    // Create payment record with the first booking's ID
    const paymentInsert = {
      booking_id: newBookings[0].id,
      amount: metadata.finalPrice,
      status: 'success',
      payment_method: 'midtrans',
      transaction_id: transactionId,
      payment_token: result.token || null,
      payment_url: result.redirect_url || null,
      payment_status: 'settlement',
      midtrans_response: result,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert payment and get the created payment record
    const { data: newPayment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentInsert])
      .select()
      .single();

    if (paymentError || !newPayment) {
      console.error('Payment record creation error:', paymentError);
      throw paymentError || new Error('Failed to create payment record');
    }

    console.log('Successfully created payment:', JSON.stringify(newPayment, null, 2));

    // Update all bookings with the payment's ID as the payment_group_id
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_group_id: newPayment.id })
      .in('id', newBookings.map(b => b.id));

    if (updateError) {
      console.error('Error updating bookings with payment ID:', updateError);
      throw updateError;
    }

    // Handle voucher if present
    if (metadata.voucher) {
      const { error: voucherError } = await supabase
        .from('voucher_usage')
        .insert({
          voucher_id: metadata.voucher.id,
          booking_id: newBookings[0].id,
          user_id: metadata.userId,
          discount_applied: metadata.voucher.discountAmount,
          original_price: metadata.totalPrice,
          final_price: metadata.finalPrice,
          used_at: new Date().toISOString()
        });

      if (voucherError) {
        console.error('Voucher usage tracking error:', voucherError);
        throw voucherError;
      }

      const { error: updateError } = await supabase
        .rpc('decrement_voucher_quantity', {
          voucher_uuid: metadata.voucher.id
        });

      if (updateError) {
        console.error('Error updating voucher quantity:', updateError);
        throw updateError;
      }
    }

    // Create notifications for each booking
    for (const booking of newBookings) {
      const bookingDate = format(new Date(booking.start_time), 'dd MMMM HH:mm');
      
      await createNotification({
        user_id: metadata.userId,
        streamer_id: parseInt(metadata.streamerId),
        message: `Payment confirmed for your booking on ${bookingDate}. Menunggu streamer menerima pesanan Anda.`,
        type: 'booking_payment',
        booking_id: booking.id,
        is_read: false
      });

      await createNotification({
        streamer_id: parseInt(metadata.streamerId),
        message: `New booking request from ${metadata.firstName} for ${bookingDate}. Payment confirmed.`,
        type: 'booking_payment',
        booking_id: booking.id,
        is_read: false
      });
    }

    return newBookings.map(booking => ({
      id: booking.id,
      client_id: booking.client_id,
      client_first_name: booking.client_first_name,
      client_last_name: booking.client_last_name
    }));

  } catch (error) {
    console.error('Error in createBookingAfterPayment:', error);
    throw error;
  }
}

export async function updatePaymentStatus(orderId: string, status: string, transactionDetails: any) {
  const supabase = createClient();
  try {
    // Extract booking ID from order ID (format: BOOKING-{id}-{timestamp})
    const bookingId = orderId.split('-')[1];
    
    if (!bookingId) throw new Error('Invalid order ID format');

    // Update booking status
    await supabase
      .from('bookings')
      .update({ 
        status: status === 'settlement' ? 'pending' : 'payment_pending',
        payment_status: status
      })
      .eq('id', parseInt(bookingId));

    // Update payment record
    const { data: payment } = await supabase
      .from('payments')
      .update({
        status: status,
        midtrans_response: transactionDetails
      })
      .eq('booking_id', parseInt(bookingId))
      .select()
      .single();

    if (payment) {
      // Record status history
      await supabase
        .from('payment_status_history')
        .insert({
          payment_id: payment.id,
          new_status: status,
          midtrans_notification: transactionDetails
        });
    }

  } catch (error) {
    console.error('Payment status update error:', error);
    throw error;
  }
} 