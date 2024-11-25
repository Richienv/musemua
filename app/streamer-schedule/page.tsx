"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Save } from "lucide-react";
import toast from 'react-hot-toast'; // Update this import

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DayOff {
  id: string;
  date: string;
}

interface TimeSlot {
  label: string;
  hours: number[];
}

interface AcceptedBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

const timeSlots: TimeSlot[] = [
  { label: "Night", hours: [0, 1, 2, 3, 4, 5] },
  { label: "Morning", hours: [6, 7, 8, 9, 10, 11] },
  { label: "Afternoon", hours: [12, 13, 14, 15, 16, 17] },
  { label: "Evening", hours: [18, 19, 20, 21, 22, 23] },
];

export default function StreamerSchedulePage() {
  const [streamerName, setStreamerName] = useState('');
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date()));
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const router = useRouter();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptedBookings, setAcceptedBookings] = useState<AcceptedBooking[]>([]);

  const fetchStreamerData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('streamers')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStreamerName(`${data.first_name} ${data.last_name}`);
        return data.id;
      }
    }
    return null;
  }, []);

  const fetchScheduleAndDaysOff = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const streamerId = await fetchStreamerData();
    
    if (streamerId) {
      // Fetch schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('streamer_schedule')
        .select('*')
        .eq('streamer_id', streamerId);

      if (scheduleError) {
        toast.error("Error fetching schedule: " + scheduleError.message);
      } else if (scheduleData) {
        setSchedule(scheduleData.map(slot => ({
          ...slot,
          startTime: slot.start_time,
          endTime: slot.end_time,
          dayOfWeek: slot.day_of_week,
          isAvailable: slot.is_available
        })));
      }

      // Fetch days off
      const { data: daysOffData, error: daysOffError } = await supabase
        .from('streamer_day_offs')
        .select('*')
        .eq('streamer_id', streamerId);

      if (daysOffError) {
        toast.error("Error fetching days off: " + daysOffError.message);
      } else if (daysOffData) {
        setDaysOff(daysOffData);
      }

      // Fetch accepted bookings
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('accepted_bookings')
        .select('*')
        .eq('streamer_id', streamerId)
        .gte('booking_date', weekStart)
        .lte('booking_date', weekEnd);

      if (bookingsError) {
        toast.error("Error fetching accepted bookings: " + bookingsError.message);
      } else if (bookingsData) {
        setAcceptedBookings(bookingsData);
      }
    }
    setIsLoading(false);
  }, [fetchStreamerData, currentWeek]);

  useEffect(() => {
    fetchScheduleAndDaysOff();
  }, [fetchScheduleAndDaysOff, currentWeek]);

  const toggleAvailability = useCallback(async (dayOfWeek: number, hour: number) => {
    const supabase = createClient();
    const streamerId = await fetchStreamerData();
    
    if (streamerId) {
      const currentDate = addDays(currentWeek, dayOfWeek);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

      // Check if the slot is booked
      const isBooked = acceptedBookings.some(b => 
        b.booking_date === formattedDate &&
        b.start_time <= startTime &&
        b.end_time > startTime
      );

      if (isBooked) {
        toast.error("Cannot modify a booked slot.");
        return;
      }

      if (selectionStart === null) {
        // Start new selection
        setSelectionStart(hour);
        setSelectionEnd(hour);
      } else if (hour === selectionStart) {
        // Cancel selection if clicking on the start hour again
        setSelectionStart(null);
        setSelectionEnd(null);
      } else {
        // Complete the selection
        const startHour = Math.min(selectionStart, hour);
        const endHour = Math.max(selectionStart, hour);

        const updatedSchedule = [...schedule];
        
        // Determine whether to set or unset availability based on the majority
        const rangeSlots = updatedSchedule.filter(s => 
          s.dayOfWeek === dayOfWeek && 
          parseInt(s.startTime) >= startHour && 
          parseInt(s.startTime) <= endHour
        );
        const availableCount = rangeSlots.filter(s => s.isAvailable).length;
        const isSettingAvailable = availableCount <= rangeSlots.length / 2;

        for (let i = startHour; i <= endHour; i++) {
          const startTime = `${i.toString().padStart(2, '0')}:00:00`;
          const endTime = `${(i + 1).toString().padStart(2, '0')}:00:00`;

          const existingSlotIndex = updatedSchedule.findIndex(s => 
            s.dayOfWeek === dayOfWeek && 
            s.startTime === startTime && 
            s.endTime === endTime
          );

          if (existingSlotIndex !== -1) {
            updatedSchedule[existingSlotIndex].isAvailable = isSettingAvailable;
          } else {
            updatedSchedule.push({
              id: `temp-${Date.now()}-${i}`,
              dayOfWeek,
              startTime,
              endTime,
              isAvailable: isSettingAvailable
            });
          }
        }

        setSchedule(updatedSchedule);

        try {
          const promises = [];
          for (let i = startHour; i <= endHour; i++) {
            const startTime = `${i.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(i + 1).toString().padStart(2, '0')}:00:00`;

            const existingSlot = schedule.find(s => 
              s.dayOfWeek === dayOfWeek && 
              s.startTime === startTime && 
              s.endTime === endTime
            );

            if (existingSlot) {
              promises.push(supabase
                .from('streamer_schedule')
                .update({ is_available: isSettingAvailable })
                .eq('id', existingSlot.id));
            } else {
              promises.push(supabase
                .from('streamer_schedule')
                .insert({
                  streamer_id: streamerId,
                  day_of_week: dayOfWeek,
                  start_time: startTime,
                  end_time: endTime,
                  is_available: isSettingAvailable
                }));
            }
          }

          await Promise.all(promises);
        } catch (error) {
          console.error('Error toggling availability:', error);
          toast.error("An unexpected error occurred. Please try again.");
          fetchScheduleAndDaysOff();
        }

        // Reset selection
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    }
  }, [fetchStreamerData, schedule, fetchScheduleAndDaysOff, selectionStart, currentWeek, acceptedBookings]);

  const handleHourMouseEnter = useCallback((hour: number) => {
    if (selectionStart !== null) {
      setSelectionEnd(hour);
    }
  }, [selectionStart]);

  const cancelSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scheduleRef.current && !scheduleRef.current.contains(event.target as Node)) {
        cancelSelection();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cancelSelection]);

  const toggleDayOff = useCallback(async (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    const streamerId = await fetchStreamerData();
    
    if (streamerId) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const existingDayOff = daysOff.find(d => d.date === formattedDate);

      try {
        if (existingDayOff) {
          // Remove day off (set to working)
          await supabase
            .from('streamer_day_offs')
            .delete()
            .eq('id', existingDayOff.id);
          setDaysOff(daysOff.filter(d => d.id !== existingDayOff.id));
        } else {
          // Add day off
          const { data, error } = await supabase
            .from('streamer_day_offs')
            .insert({
              streamer_id: streamerId,
              date: formattedDate
            })
            .select()
            .single();
          
          if (error) throw error;
          setDaysOff([...daysOff, data]);
        }
      } catch (error) {
        console.error('Error toggling day off:', error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  }, [fetchStreamerData, daysOff]);

  const saveSchedule = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const streamerId = await fetchStreamerData();
    
    if (streamerId) {
      try {
        // Prepare the schedule data
        const scheduleData = Array.from({ length: 7 }, (_, day) => {
          const currentDate = addDays(currentWeek, day);
          const formattedDate = format(currentDate, 'yyyy-MM-dd');
          const dayBookings = acceptedBookings.filter(b => b.booking_date === formattedDate);
          
          return {
            day,
            slots: schedule
              .filter(slot => slot.dayOfWeek === day && slot.isAvailable)
              .map(slot => ({ 
                start: slot.startTime, 
                end: slot.endTime,
                isBooked: dayBookings.some(b => 
                  b.start_time <= slot.startTime && b.end_time > slot.startTime
                )
              }))
          };
        });

        // Check if an active schedule exists
        const { data: existingSchedule, error: checkError } = await supabase
          .from('streamer_active_schedules')
          .select('id')
          .eq('streamer_id', streamerId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        let activeScheduleError;
        if (existingSchedule) {
          // Update existing schedule
          const { error } = await supabase
            .from('streamer_active_schedules')
            .update({ schedule: JSON.stringify(scheduleData) })
            .eq('streamer_id', streamerId);
          activeScheduleError = error;
        } else {
          // Insert new schedule
          const { error } = await supabase
            .from('streamer_active_schedules')
            .insert({ streamer_id: streamerId, schedule: JSON.stringify(scheduleData) });
          activeScheduleError = error;
        }

        if (activeScheduleError) throw activeScheduleError;

        // Update streamer_schedule table
        const { error: deleteError } = await supabase
          .from('streamer_schedule')
          .delete()
          .eq('streamer_id', streamerId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('streamer_schedule')
          .insert(
            schedule.map(slot => ({
              streamer_id: streamerId,
              day_of_week: slot.dayOfWeek,
              start_time: slot.startTime,
              end_time: slot.endTime,
              is_available: slot.isAvailable
            }))
          );

        if (insertError) throw insertError;

        // Update streamer_day_offs table
        const { error: daysOffError } = await supabase
          .from('streamer_day_offs')
          .upsert(
            daysOff.map(dayOff => ({
              streamer_id: streamerId,
              date: dayOff.date
            })),
            { onConflict: 'streamer_id,date' }
          );

        if (daysOffError) throw daysOffError;

        console.log('Schedule saved successfully, showing toast...');
        
        toast.success('You\'ve successfully updated your schedule.', {
          duration: 5000,
        });

        // Refresh the schedule data after saving
        fetchScheduleAndDaysOff();
      } catch (error) {
        console.error('Error saving schedule:', error);
        
        toast.error('Failed to save and activate the schedule. Please try again.', {
          duration: 5000,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const renderDaySchedule = useCallback((day: number) => {
    const currentDate = addDays(currentWeek, day);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    const isDayOff = daysOff.some(d => d.date === formattedDate);
    const isExpanded = expandedDay === day;

    const dayBookings = acceptedBookings.filter(b => b.booking_date === formattedDate);

    const toggleExpand = (e: React.MouseEvent) => {
      e.preventDefault();
      setExpandedDay(isExpanded ? null : day);
    };

    return (
      <div key={day} className="mb-2 border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <div 
          className={`flex justify-between items-center p-3 cursor-pointer ${isDayOff ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-50`}
          onClick={toggleExpand}
        >
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900">{format(currentDate, 'EEE, MMM d')}</span>
          </div>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className={`mr-2 h-6 ${!isDayOff ? 'bg-[#000080] text-white' : ''}`}
              onClick={(e) => toggleDayOff(e, currentDate)}
            >
              {isDayOff ? 'Day Off' : 'Working'}
            </Button>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {isExpanded && !isDayOff && (
          <div className="p-3 bg-white border-t border-gray-200">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot.label} className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">{timeSlot.label}</h4>
                <div className="grid grid-cols-6 gap-1">
                  {timeSlot.hours.map((hour) => {
                    const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
                    const slot = schedule.find(s => s.dayOfWeek === day && s.startTime === startTime);
                    const isBooked = dayBookings.some(b => 
                      b.start_time <= startTime && b.end_time > startTime
                    );
                    const isInSelectionRange = selectionStart !== null && selectionEnd !== null && 
                      ((hour >= selectionStart && hour <= selectionEnd) || (hour <= selectionStart && hour >= selectionEnd));
                    return (
                      <Button
                        key={hour}
                        variant="outline"
                        size="sm"
                        className={`p-1 h-8 text-xs ${
                          isBooked
                            ? 'bg-red-500 text-white cursor-not-allowed'
                            : slot?.isAvailable 
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : isInSelectionRange
                              ? 'bg-blue-200 hover:bg-blue-300'
                              : 'hover:bg-gray-100'
                        } ${hour === selectionStart ? 'ring-2 ring-blue-400' : ''}`}
                        onClick={() => !isBooked && toggleAvailability(day, hour)}
                        onMouseEnter={() => handleHourMouseEnter(hour)}
                        disabled={isBooked}
                      >
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [currentWeek, daysOff, expandedDay, schedule, toggleAvailability, toggleDayOff, selectionStart, selectionEnd, handleHourMouseEnter, acceptedBookings]);

  if (isLoading) {
    return <div className="text-center py-10 text-sm text-gray-600">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl" ref={scheduleRef}>
      <h1 className="text-2xl font-medium text-gray-900 mb-4">{streamerName}'s Schedule</h1>
      <div className="flex justify-between items-center mb-4">
        <Button 
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <ChevronLeft className="mr-1 h-3 w-3" /> Previous Week
        </Button>
        <span className="text-sm font-medium text-gray-700">
          {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
        </span>
        <Button 
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Next Week <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2 mb-4">
        {Array.from({ length: 7 }, (_, day) => renderDaySchedule(day))}
      </div>
      <div className="flex justify-between items-center">
        <Button 
          onClick={() => router.push('/streamer-dashboard')} 
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Back to Dashboard
        </Button>
        <Button 
          onClick={saveSchedule}
          size="sm"
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  );
}