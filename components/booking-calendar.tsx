import { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  isDayOff: (date: Date) => boolean;
  selectedClassName?: string;
}

export function BookingCalendar({ 
  selectedDate, 
  setSelectedDate, 
  isDayOff,
  selectedClassName = "bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white hover:from-[#1e3a8a] hover:to-[#581c87]"
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  return (
    <div className="space-y-4 sm:space-y-6 text-sm sm:text-base">
      <div className="flex justify-between items-center">
        <button onClick={prevWeek} className="p-1 hover:bg-gray-100 rounded-md">
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <span className="text-sm sm:text-base font-medium">
          {format(weekStart, 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d')}
        </span>
        <button onClick={nextWeek} className="p-1 hover:bg-gray-100 rounded-md">
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => (
          <Button
            key={day.toString()}
            variant={selectedDate && day.getTime() === selectedDate.getTime() ? "default" : "ghost"}
            className={`p-1 sm:p-2 h-auto flex flex-col ${
              selectedDate && day.getTime() === selectedDate.getTime()
                ? selectedClassName
                : isDayOff(day)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
            onClick={() => setSelectedDate(day)}
            disabled={isDayOff(day)}
          >
            <span className="text-[10px] sm:text-xs">{format(day, 'EEE')}</span>
            <span className="text-xs sm:text-base font-bold">{format(day, 'd')}</span>
          </Button>
        ))}
      </div>
    </div>
  );
} 