import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format, startOfWeek, endOfWeek, isSameMonth, isToday, isBefore, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AvailabilityFilterProps {
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

export function AvailabilityFilter({ selectedDate, setSelectedDate }: AvailabilityFilterProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleDateChange = (date: Date) => {
    setSelectedDate(prevDate => 
      isSameDay(prevDate, date) ? null : date
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const isSelected = (date: Date) => selectedDate && isSameDay(selectedDate, date);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 
          hover:bg-gray-50 transition-all duration-200">
          <Calendar size={18} className="text-gray-600" />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select Date'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={handlePreviousWeek} variant="ghost" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentWeekStart, 'd')} - {format(endOfWeek(currentWeekStart), 'd MMM')}
            </span>
            <Button onClick={handleNextWeek} variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
            {weekDays.map((date, index) => {
              const isSelectedDate = isSelected(date);
              const isCurrentMonth = isSameMonth(date, currentWeekStart);
              const isCurrentDay = isToday(date);
              const isPastDate = isBefore(date, new Date()) && !isCurrentDay;

              return (
                <Button
                  key={date.toISOString()}
                  variant="ghost"
                  size="sm"
                  onClick={() => !isPastDate && handleDateChange(date)}
                  className={`
                    p-2 h-10 w-10 flex flex-col items-center justify-center
                    ${isSelectedDate ? 'bg-blue-100 text-blue-600' : ''}
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isCurrentDay ? 'border border-blue-600' : ''}
                    ${isPastDate ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                  `}
                  disabled={isPastDate}
                >
                  <span className={`text-sm ${isSelectedDate ? 'font-bold' : ''}`}>
                    {format(date, 'd')}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
