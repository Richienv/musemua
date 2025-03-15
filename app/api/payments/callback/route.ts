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
  const startTime = Date.now();
  console.log(`[${startTime}] Payment callback received`);
  
  try {
    const body: PaymentCallbackBody = await request.json();
    
    const { result, metadata } = body;

    if (!result || !metadata) {
      console.error(`[${Date.now()}] Missing required data in callback`);
      throw new Error('Missing required payment data');
    }

    console.log(`[${Date.now()}] Payment data validated, processing ${metadata.bookings.length} bookings`);

    try {
      // Start the booking creation process
      const bookings = await createBookingAfterPayment(result, metadata);
      console.log(`[${Date.now()}] Bookings created successfully in ${Date.now() - startTime}ms`);
      return NextResponse.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error(`[${Date.now()}] Error in createBookingAfterPayment after ${Date.now() - startTime}ms:`, error);
      
      // Return a more detailed error response
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to create booking',
          details: error instanceof Error ? error.message : 'Unknown error',
          processingTime: `${Date.now() - startTime}ms`
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error(`[${Date.now()}] Payment callback error after ${Date.now() - startTime}ms:`, error);
    return new NextResponse(
      JSON.stringify({
        error: 'Payment callback failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${Date.now() - startTime}ms`
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 