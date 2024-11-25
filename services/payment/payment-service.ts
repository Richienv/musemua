import { createClient } from "@/utils/supabase/client";
import midtransClient from 'midtrans-client';

// Initialize Snap client
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

interface PaymentDetails {
  amount: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  description: string;
  metadata: {
    streamerId: string;
    userId: string;
    startTime: string;
    endTime: string;
    platform: string;
    specialRequest?: string;
    subAccountLink?: string;
    firstName: string;
    lastName: string;
    price: number;
  };
}

export async function createPayment(details: PaymentDetails) {
  const supabase = createClient();
  
  try {
    // Create booking first
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: details.metadata.userId,
        streamer_id: parseInt(details.metadata.streamerId),
        start_time: details.metadata.startTime,
        end_time: details.metadata.endTime,
        platform: details.metadata.platform,
        status: 'payment_pending',
        special_request: details.metadata.specialRequest,
        price: details.metadata.price,
        client_first_name: details.metadata.firstName,
        client_last_name: details.metadata.lastName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Generate Midtrans token with finish URL
    const transactionDetails = {
      transaction_details: {
        order_id: `BOOKING-${bookingData.id}-${Date.now()}`,
        gross_amount: details.amount
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
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/client-bookings`
      }
    };

    const transaction = await snap.createTransaction(transactionDetails);

    if (!transaction || !transaction.token) {
      // Clean up the booking if payment token creation fails
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingData.id);
      throw new Error('Failed to generate Midtrans token');
    }

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        booking_id: bookingData.id,
        amount: details.amount,
        status: 'pending',
        payment_method: 'midtrans',
        payment_token: transaction.token,
        transaction_id: transactionDetails.transaction_details.order_id
      });

    return {
      token: transaction.token,
      bookingId: bookingData.id,
      orderId: transactionDetails.transaction_details.order_id
    };

  } catch (error) {
    console.error('Payment creation error:', error);
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