"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react";
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

interface ScheduleChange {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
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
  const [unsavedChanges, setUnsavedChanges] = useState<ScheduleChange[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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
      // Get week range for filtering other data
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

      // Fetch schedule patterns
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

      // Fetch days off for specific week
      const { data: daysOffData, error: daysOffError } = await supabase
        .from('streamer_day_offs')
        .select('*')
        .eq('streamer_id', streamerId)
        .gte('date', weekStart)
        .lte('date', weekEnd);

      if (daysOffError) {
        toast.error("Error fetching days off: " + daysOffError.message);
      } else if (daysOffData) {
        setDaysOff(daysOffData);
      }

      // Fetch accepted bookings
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
    setSchedule([]); // Reset schedule when week changes
    fetchScheduleAndDaysOff();
  }, [fetchScheduleAndDaysOff, currentWeek]);

  const toggleAvailability = useCallback(async (dayOfWeek: number, hour: number) => {
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
      setSelectionStart(hour);
      setSelectionEnd(hour);
    } else if (hour === selectionStart) {
      setSelectionStart(null);
      setSelectionEnd(null);
    } else {
      const startHour = Math.min(selectionStart, hour);
      const endHour = Math.max(selectionStart, hour);

      const updatedSchedule = [...schedule];
      const newChanges = [...unsavedChanges];
      
      // Determine availability based on majority
      const rangeSlots = updatedSchedule.filter(s => 
        s.dayOfWeek === dayOfWeek && 
        parseInt(s.startTime) >= startHour && 
        parseInt(s.startTime) <= endHour
      );
      const availableCount = rangeSlots.filter(s => s.isAvailable).length;
      const isSettingAvailable = availableCount <= rangeSlots.length / 2;

      // Update local state only
      for (let i = startHour; i <= endHour; i++) {
        const slotStartTime = `${i.toString().padStart(2, '0')}:00:00`;
        const slotEndTime = `${(i + 1).toString().padStart(2, '0')}:00:00`;

        const existingSlotIndex = updatedSchedule.findIndex(s => 
          s.dayOfWeek === dayOfWeek && 
          s.startTime === slotStartTime && 
          s.endTime === slotEndTime
        );

        if (existingSlotIndex !== -1) {
          updatedSchedule[existingSlotIndex].isAvailable = isSettingAvailable;
        } else {
          updatedSchedule.push({
            id: `temp-${Date.now()}-${i}`,
            dayOfWeek,
            startTime: slotStartTime,
            endTime: slotEndTime,
            isAvailable: isSettingAvailable
          });
        }

        // Track changes
        newChanges.push({
          dayOfWeek,
          startTime: slotStartTime,
          endTime: slotEndTime,
          isAvailable: isSettingAvailable
        });
      }

      setSchedule(updatedSchedule);
      setUnsavedChanges(newChanges);
      setHasChanges(true);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [selectionStart, schedule, unsavedChanges, currentWeek, acceptedBookings]);

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
        // Apply all changes to database
        const promises = unsavedChanges.map(change => {
          const existingSlot = schedule.find(s => 
            s.dayOfWeek === change.dayOfWeek && 
            s.startTime === change.startTime && 
            s.endTime === change.endTime
          );

          if (existingSlot && existingSlot.id.startsWith('temp-')) {
            return supabase
              .from('streamer_schedule')
              .insert({
                streamer_id: streamerId,
                day_of_week: change.dayOfWeek,
                start_time: change.startTime,
                end_time: change.endTime,
                is_available: change.isAvailable
              });
          } else if (existingSlot) {
            return supabase
              .from('streamer_schedule')
              .update({ is_available: change.isAvailable })
              .eq('id', existingSlot.id);
          }
        });

        await Promise.all(promises);

        // Update active schedule
        const scheduleData = Array.from({ length: 7 }, (_, day) => ({
          day,
          slots: schedule
            .filter(slot => slot.dayOfWeek === day && slot.isAvailable)
            .map(slot => ({ 
              start: slot.startTime, 
              end: slot.endTime 
            }))
        }));

        await supabase
          .from('streamer_active_schedules')
          .upsert({ 
            streamer_id: streamerId, 
            schedule: scheduleData 
          }, { onConflict: 'streamer_id' });

        toast.success('Jadwal berhasil disimpan');
        setUnsavedChanges([]);
        setHasChanges(false);
        await fetchScheduleAndDaysOff(); // Refresh data
      } catch (error) {
        console.error('Error saving schedule:', error);
        toast.error('Gagal menyimpan jadwal');
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
      <div key={day} className="bg-white rounded-lg border border-gray-100 shadow-sm transition-all duration-200 hover:border-[#E23744]/20">
        <div 
          className={`flex justify-between items-center p-4 cursor-pointer ${
            isDayOff ? 'bg-gray-50' : 'bg-white'
          } hover:bg-gray-50/50`}
          onClick={toggleExpand}
        >
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900">
              {format(currentDate, 'EEEE, d MMMM yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-4 ${
                !isDayOff 
                  ? 'bg-[#E23744] text-white hover:bg-[#E23744]/90 border-[#E23744]' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={(e) => toggleDayOff(e, currentDate)}
            >
              {isDayOff ? 'Hari Libur' : 'Hari Kerja'}
            </Button>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {isExpanded && !isDayOff && (
          <div className="p-4 bg-white border-t border-gray-100">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot.label} className="mb-4 last:mb-0">
                <h4 className="text-xs font-medium text-gray-600 mb-2">{timeSlot.label}</h4>
                <div className="grid grid-cols-6 gap-2">
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
                        className={`p-1 h-8 text-xs font-medium transition-all duration-200 ${
                          isBooked
                            ? 'bg-red-500 text-white cursor-not-allowed border-red-500'
                            : slot?.isAvailable 
                              ? 'bg-[#E23744] text-white hover:bg-[#E23744]/90 border-[#E23744]'
                              : isInSelectionRange
                              ? 'bg-[#E23744]/20 hover:bg-[#E23744]/30 border-[#E23744]/20'
                              : 'hover:bg-gray-50 border-gray-200'
                        } ${hour === selectionStart ? 'ring-2 ring-[#E23744]' : ''}`}
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

  // Add warning when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const isDayOff = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return daysOff.some(d => d.date === formattedDate);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-sm text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Pengaturan Jadwal</h1>
          <p className="text-sm text-gray-500">
            Atur jadwal live streaming Anda untuk memudahkan client melakukan booking.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
              </span>
              <div className="flex w-full sm:w-auto gap-2">
                <Button 
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs border-[#E23744] text-[#E23744] hover:bg-[#E23744]/10"
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Minggu Sebelumnya</span>
                </Button>
                <Button 
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs border-[#E23744] text-[#E23744] hover:bg-[#E23744]/10"
                >
                  <span className="hidden sm:inline">Minggu Selanjutnya</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#E23744]" />
              </div>
            ) : (
              <div className="space-y-3" ref={scheduleRef}>
                {Array.from({ length: 7 }, (_, day) => {
                  const currentDate = addDays(currentWeek, day);
                  const dayBookings = acceptedBookings.filter(b => 
                    format(new Date(b.booking_date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                  );

                  return (
                    <div key={day} className="bg-white rounded-lg border border-gray-100 shadow-sm transition-all duration-200 hover:border-[#E23744]/20">
                      <div 
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50/50"
                        onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                      >
                        <div className="flex items-center">
                          <span className="text-sm sm:text-base font-medium text-gray-900">
                            {format(currentDate, 'EEEE, d MMMM yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 px-3 sm:px-4 text-xs ${
                              !isDayOff(currentDate)
                                ? 'bg-[#E23744] text-white hover:bg-[#E23744]/90 border-[#E23744]' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                            onClick={(e) => toggleDayOff(e, currentDate)}
                          >
                            {isDayOff(currentDate) ? 'Hari Libur' : 'Hari Kerja'}
                          </Button>
                          {expandedDay === day ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {expandedDay === day && !isDayOff(currentDate) && (
                        <div className="p-4 bg-white border-t border-gray-100">
                          {timeSlots.map((timeSlot) => (
                            <div key={timeSlot.label} className="mb-4 last:mb-0">
                              <h4 className="text-xs font-medium text-gray-600 mb-2">{timeSlot.label}</h4>
                              <div className="grid grid-cols-6 gap-2">
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
                                      className={`p-1 h-8 text-xs font-medium transition-all duration-200 ${
                                        isBooked
                                          ? 'bg-red-500 text-white cursor-not-allowed border-red-500'
                                          : slot?.isAvailable 
                                            ? 'bg-[#E23744] text-white hover:bg-[#E23744]/90 border-[#E23744]'
                                            : isInSelectionRange
                                            ? 'bg-[#E23744]/20 hover:bg-[#E23744]/30 border-[#E23744]/20'
                                            : 'hover:bg-gray-50 border-gray-200'
                                      } ${hour === selectionStart ? 'ring-2 ring-[#E23744]' : ''}`}
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
                })}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <Button 
                onClick={() => router.push('/streamer-dashboard')} 
                variant="outline"
                className="text-xs sm:text-sm border-[#E23744] text-[#E23744] hover:bg-[#E23744]/10"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Button>
              <Button 
                onClick={saveSchedule}
                className="text-xs sm:text-sm bg-gradient-to-r from-[#E23744] to-[#E23744]/90 hover:from-[#E23744]/90 hover:to-[#E23744] text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Jadwal
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}