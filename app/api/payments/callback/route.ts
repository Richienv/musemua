import { NextResponse } from 'next/server';
import { createBookingAfterPayment, type PaymentMetadata } from '@/services/payment/payment-service';

// Add these interfaces at the top of the file
interface Booking {
  date: string;
  timeRanges: string[];
  startTime: string;
  endTime: string;
}

interface PaymentCallbackBody {
  result: any; // You can make this more specific based on your payment provider's response type
  metadata: PaymentMetadata;
}

export async function POST(request: Request) {
  try {
    console.log('=== Payment Callback Start ===');
    const body: PaymentCallbackBody = await request.json();
    console.log('Raw callback body:', JSON.stringify(body, null, 2));

    const { result, metadata } = body;

    if (!result || !metadata) {
      console.error('Missing required data in callback:', { result, metadata });
      throw new Error('Missing required payment data');
    }

    console.log('=== Payment Callback Data Validation ===');
    console.log('Payment result:', JSON.stringify(result, null, 2));
    console.log('Payment metadata:', JSON.stringify(metadata, null, 2));
    console.log('Booking time ranges:', JSON.stringify(metadata.bookings.map(b => ({
      date: b.date,
      timeRanges: b.timeRanges,
      startTime: b.startTime,
      endTime: b.endTime
    })), null, 2));

    try {
      const bookings = await createBookingAfterPayment(result, metadata);
      console.log('Bookings created successfully:', JSON.stringify(bookings, null, 2));
      return NextResponse.json(bookings);
    } catch (error) {
      console.error('Error in createBookingAfterPayment:', error);
      // Return a more detailed error response
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to create booking',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Payment callback failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 