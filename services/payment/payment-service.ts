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
  const startTime = Date.now();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Helper function for conditional logging
  const log = (message: string, data?: any) => {
    console.log(`[${Date.now() - startTime}ms] ${message}`);
    
    // Detailed logging only in development environment
    if (!isProduction && data) {
      console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
  };
  
  try {
    log('Creating booking after payment');
    
    const transactionId = result.order_id || result.transaction_id;
    if (!transactionId) {
      throw new Error('Missing transaction ID in payment result');
    }

    // Create bookings array with proper time blocks
    log('Processing bookings');
    const bookingInserts = metadata.bookings.map(booking => {
      // If no timeRanges, create a single booking
      const timeBlocks = booking.timeRanges?.length ? booking.timeRanges : [{
        start: booking.startTime.split('T')[1] || booking.startTime,
        end: booking.endTime.split('T')[1] || booking.endTime,
        duration: booking.hours
      }];
      
      // Create a booking for each time block
      return timeBlocks.map(block => {
        // Create the full ISO string by combining date and time
        const startTime = new Date(`${booking.date}T${block.start.split('T')[1] || block.start}`);
        const endTime = new Date(`${booking.date}T${block.end.split('T')[1] || block.end}`);

        // Store the times in UTC format without any manual adjustments
        return {
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
      });
    }).flat();

    log(`Total bookings to create: ${bookingInserts.length}`);

    // Process bookings in chunks of 10
    const CHUNK_SIZE = 10;
    const bookingChunks = [];
    for (let i = 0; i < bookingInserts.length; i += CHUNK_SIZE) {
      bookingChunks.push(bookingInserts.slice(i, i + CHUNK_SIZE));
    }
    
    log(`Split into ${bookingChunks.length} chunks of max ${CHUNK_SIZE} bookings each`);

    // Insert bookings in chunks
    const newBookings = [];
    for (let i = 0; i < bookingChunks.length; i++) {
      const chunk = bookingChunks[i];
      log(`Processing chunk ${i+1}/${bookingChunks.length} (${chunk.length} bookings)`);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(chunk)
        .select();

      if (error) {
        log(`Error inserting chunk ${i+1}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        log(`No bookings returned for chunk ${i+1}`);
        continue;
      }
      
      log(`Successfully inserted ${data.length} bookings in chunk ${i+1}`);
      newBookings.push(...data);
    }
    
    if (newBookings.length === 0) {
      throw new Error('Failed to create any bookings');
    }
    
    log(`Successfully created ${newBookings.length} bookings in total`);

    // Create payment record with the first booking's ID
    log('Creating payment record');
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
      log('Payment record creation error:', paymentError);
      throw paymentError || new Error('Failed to create payment record');
    }

    log('Successfully created payment record');

    // Update all bookings with the payment's ID as the payment_group_id
    // Process update in chunks as well if there are many bookings
    const bookingIds = newBookings.map(b => b.id);
    const idChunks = [];
    for (let i = 0; i < bookingIds.length; i += CHUNK_SIZE) {
      idChunks.push(bookingIds.slice(i, i + CHUNK_SIZE));
    }
    
    log(`Updating ${bookingIds.length} bookings with payment group ID`);
    
    for (let i = 0; i < idChunks.length; i++) {
      const chunk = idChunks[i];
      log(`Updating payment group for ${chunk.length} bookings (chunk ${i+1}/${idChunks.length})`);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ payment_group_id: newPayment.id })
        .in('id', chunk);

      if (updateError) {
        log(`Error updating chunk ${i+1} with payment ID:`, updateError);
        throw updateError;
      }
    }

    // Handle voucher if present
    if (metadata.voucher) {
      log('Processing voucher usage');
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
        log('Voucher usage tracking error:', voucherError);
        throw voucherError;
      }

      const { error: updateError } = await supabase
        .rpc('decrement_voucher_quantity', {
          voucher_uuid: metadata.voucher.id
        });

      if (updateError) {
        log('Error updating voucher quantity:', updateError);
        throw updateError;
      }
      
      log('Voucher processed successfully');
    }

    // Create notifications for each booking asynchronously
    // We don't need to wait for notifications to complete
    log('Creating notifications (asynchronous)');
    createNotificationsAsync(newBookings, metadata, supabase);
    
    log(`Booking process completed successfully in ${Date.now() - startTime}ms`);
    
    // Return the booking information
    return newBookings.map(booking => ({
      id: booking.id,
      client_id: booking.client_id,
      client_first_name: booking.client_first_name,
      client_last_name: booking.client_last_name
    }));

  } catch (error) {
    console.error(`Error in createBookingAfterPayment after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
}

// Helper function to create notifications asynchronously
async function createNotificationsAsync(
  bookings: any[], 
  metadata: PaymentMetadata, 
  supabase: any
) {
  try {
    // First fetch the streamer's user_id (do this once)
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('user_id')
      .eq('id', metadata.streamerId)
      .single();
    
    if (streamerError) {
      console.error('Error fetching streamer user_id:', streamerError);
      return; // Non-blocking, continue even if error
    }

    // Process notifications in batches
    const NOTIFICATION_BATCH_SIZE = 10;
    let notifications = [];
    
    // Create notification objects for all bookings
    for (const booking of bookings) {
      const bookingDate = format(new Date(booking.start_time), 'dd MMMM HH:mm');
      
      // Notification for client
      notifications.push({
        user_id: metadata.userId,
        streamer_id: parseInt(metadata.streamerId),
        message: `Payment confirmed for your booking on ${bookingDate}. Menunggu streamer menerima pesanan Anda.`,
        type: 'booking_payment',
        booking_id: booking.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
      
      // Notification for streamer
      if (streamerData?.user_id) {
        notifications.push({
          user_id: streamerData.user_id,
          streamer_id: parseInt(metadata.streamerId),
          message: `New booking request from ${metadata.firstName} for ${bookingDate}. Payment confirmed.`,
          type: 'booking_payment',
          booking_id: booking.id,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
      
      // Insert in batches if we've collected enough
      if (notifications.length >= NOTIFICATION_BATCH_SIZE) {
        await supabase.from('notifications').insert(notifications);
        notifications = [];
      }
    }
    
    // Insert any remaining notifications
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
    
    console.log(`Created ${bookings.length * 2} notifications asynchronously`);
  } catch (error) {
    console.error('Error creating notifications (non-blocking):', error);
    // Non-blocking - we don't want notification errors to affect booking creation
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