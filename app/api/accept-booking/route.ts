import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  // Start a transaction
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const { data: acceptedBooking, error: insertError } = await supabase
    .from('accepted_bookings')
    .insert({
      streamer_id: booking.streamer_id,
      client_id: booking.client_id,
      booking_date: booking.start_time.split('T')[0],
      start_time: booking.start_time.split('T')[1],
      end_time: booking.end_time.split('T')[1]
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to accept booking' }, { status: 500 });
  }

  // Update the booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'accepted' })
    .eq('id', bookingId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Booking accepted successfully', booking: acceptedBooking });
}