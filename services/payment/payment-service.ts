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

const isProduction = process.env.NODE_ENV === 'production';
const log = (message: string, data: any = null) => {
  if (isProduction) {
    console.log(message);
  } else {
    console.log(message, data ? JSON.stringify(data, null, 2) : '');
  }
};

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
  
  try {
    log('Creating booking after payment - Start', { 
      orderId: result.order_id || result.transaction_id,
      userInfo: `${metadata.firstName} ${metadata.lastName}`,
      bookingsCount: metadata.bookings.length,
      startTime
    });
    
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

    log('Booking data prepared', { 
      totalBookings: bookingInserts.length,
      processingTime: `${Date.now() - startTime}ms`
    });

    // Implement chunking for bulk bookings - Process in batches of 10
    const CHUNK_SIZE = 10;
    const bookingChunks = [];
    for (let i = 0; i < bookingInserts.length; i += CHUNK_SIZE) {
      bookingChunks.push(bookingInserts.slice(i, i + CHUNK_SIZE));
    }
    
    log('Split bookings into chunks', { 
      totalChunks: bookingChunks.length,
      chunkSize: CHUNK_SIZE 
    });

    // Process each chunk sequentially
    const newBookings = [];
    for (let i = 0; i < bookingChunks.length; i++) {
      const chunk = bookingChunks[i];
      log(`Processing chunk ${i+1}/${bookingChunks.length}`, { 
        chunkSize: chunk.length,
        elapsedTime: `${Date.now() - startTime}ms` 
      });
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(chunk)
        .select();

      if (error) {
        log('Error inserting booking chunk', { error, chunkIndex: i });
        throw error;
      }
      
      if (data) newBookings.push(...data);
      log(`Completed chunk ${i+1}/${bookingChunks.length}`, { 
        processedCount: newBookings.length,
        elapsedTime: `${Date.now() - startTime}ms` 
      });
    }

    if (newBookings.length === 0) {
      log('No bookings were created', { elapsedTime: `${Date.now() - startTime}ms` });
      throw new Error('Failed to create bookings');
    }

    log('Successfully created all bookings', { 
      totalCreated: newBookings.length,
      elapsedTime: `${Date.now() - startTime}ms` 
    });

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
    log('Creating payment record');
    const { data: newPayment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentInsert])
      .select()
      .single();

    if (paymentError || !newPayment) {
      log('Payment record creation error', paymentError);
      throw paymentError || new Error('Failed to create payment record');
    }

    log('Successfully created payment record', { 
      paymentId: newPayment.id,
      elapsedTime: `${Date.now() - startTime}ms` 
    });

    // Update all bookings with the payment's ID as the payment_group_id
    log('Updating bookings with payment group ID');
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_group_id: newPayment.id })
      .in('id', newBookings.map(b => b.id));

    if (updateError) {
      log('Error updating bookings with payment ID', updateError);
      throw updateError;
    }

    // Handle voucher if present
    if (metadata.voucher) {
      log('Processing voucher');
      const { error: voucherError } = await supabase
        .from('voucher_usages')
        .insert([{
          voucher_id: metadata.voucher.id,
          user_id: metadata.userId,
          booking_id: newBookings[0].id,
          amount: metadata.voucher.discountAmount,
          used_at: new Date().toISOString()
        }]);

      if (voucherError) {
        log('Voucher usage recording error', voucherError);
        // Don't throw here, just log the error as this is not critical
      }
    }

    // Create notifications asynchronously (don't await)
    log('Creating notifications (async)');
    createNotificationsAsync(newBookings, metadata);

    log('Booking creation process complete', { 
      totalTime: `${Date.now() - startTime}ms`,
      bookingsCreated: newBookings.length
    });

    return newBookings.map(booking => ({
      id: booking.id,
      client_id: booking.client_id,
      client_first_name: booking.client_first_name,
      client_last_name: booking.client_last_name
    }));

  } catch (error) {
    log('Error in createBookingAfterPayment', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: `${Date.now() - startTime}ms`
    });
    throw error;
  }
}

// Add a new function for asynchronous notification creation
function createNotificationsAsync(bookings: any[], metadata: PaymentMetadata): void {
  // This runs in the background without awaiting
  Promise.all(bookings.map(booking => 
    createNotification({
      streamer_id: parseInt(metadata.streamerId),
      message: `New booking request from ${metadata.firstName} ${metadata.lastName}. Payment confirmed.`,
      type: 'booking_payment',
      booking_id: booking.id,
      is_read: false
    }).catch(error => {
      console.error('Failed to create notification (non-blocking):', error);
    })
  )).catch(error => {
    console.error('Error in background notification creation:', error);
  });
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