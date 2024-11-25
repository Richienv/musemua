"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayPickerDefaultProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const INDONESIAN_WEEKDAYS = {
  0: 'Min',
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab'
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      weekStartsOn={1}
      locale={{
        ...props.locale,
        weekdays: {
          narrow: Object.values(INDONESIAN_WEEKDAYS),
          short: Object.values(INDONESIAN_WEEKDAYS),
          long: Object.values(INDONESIAN_WEEKDAYS),
        }
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center items-center relative px-8",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center absolute inset-0 justify-between",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 text-slate-600 hover:bg-slate-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between mb-1",
        head_cell: "text-slate-500 w-8 text-[0.7rem] font-normal",
        row: "flex w-full mt-2 justify-between",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has([aria-selected])]:bg-slate-100 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:bg-slate-100 [&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal text-sm aria-selected:opacity-100"
        ),
        day_selected:
          "bg-slate-900 text-slate-50 hover:bg-slate-800 hover:text-slate-50 focus:bg-slate-900 focus:text-slate-50",
        day_today: "bg-slate-100/50 text-slate-900",
        day_outside: "text-slate-500 opacity-50",
        day_disabled: "text-slate-500 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-slate-600" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-slate-600" />
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar }; 