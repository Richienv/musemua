import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function BookingForm({ streamerId }: { streamerId: number }) {
  const checkAvailability = async (date: string, startTime: string, endTime: string) => {
    const supabase = createClientComponentClient();
    
    // Check streamer's schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('streamer_schedule')
      .select('*')
      .eq('streamer_id', streamerId)
      .eq('day_of_week', new Date(date).getDay())
      .gte('start_time', startTime)
      .lt('end_time', endTime);

    if (scheduleError) {
      console.error('Error checking schedule:', scheduleError);
      return false;
    }

    if (scheduleData.length === 0 || !scheduleData[0].is_available) {
      return false;
    }

    // Check accepted bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('accepted_bookings')
      .select('*')
      .eq('streamer_id', streamerId)
      .eq('booking_date', date)
      .or(`start_time.lte.${endTime},end_time.gt.${startTime}`);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return false;
    }

    return bookingsData.length === 0;
  };
}