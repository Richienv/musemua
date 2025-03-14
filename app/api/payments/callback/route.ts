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
    console.log('Server time:', new Date().toISOString());
    console.log('Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', JSON.stringify(headers, null, 2));
    
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
    
    if (metadata.bookings && metadata.bookings.length > 0) {
      console.log('Client timezone from metadata:', metadata.timezone);
      
      // Log detailed booking time information for each booking
      metadata.bookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1} details:`);
        console.log(`Date: ${booking.date}`);
        console.log(`Start time: ${booking.startTime}`);
        console.log(`End time: ${booking.endTime}`);
        
        // Parse and log the dates in different formats to detect time zone issues
        try {
          const startDate = new Date(`${booking.date}T${booking.startTime}`);
          const endDate = new Date(`${booking.date}T${booking.endTime}`);
          
          console.log('Parsed start date (ISO):', startDate.toISOString());
          console.log('Parsed start date (UTC string):', startDate.toUTCString());
          console.log('Parsed start date (local string):', startDate.toString());
          
          console.log('Parsed end date (ISO):', endDate.toISOString());
          console.log('Parsed end date (UTC string):', endDate.toUTCString());
          console.log('Parsed end date (local string):', endDate.toString());
        } catch (error) {
          console.error('Error parsing dates:', error);
        }
        
        console.log('Time ranges:', JSON.stringify(booking.timeRanges, null, 2));
      });
    }

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