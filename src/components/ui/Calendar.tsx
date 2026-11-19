"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  showOutsideDays = true,
  classNames,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={
        {
          months:
            "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-100 h-7 w-7 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-gray-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-gray-400",
          row: "flex w-full mt-2",
          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected])]:bg-gray-800",
          day: cn(
            "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md dark:hover:bg-gray-700",
          ),
          day_selected:
            "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
          day_today:
            "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white",
          day_outside: "text-gray-400 opacity-50 dark:text-gray-600",
          day_disabled: "text-gray-400 opacity-50 dark:text-gray-600",
          day_range_middle:
            "aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-800 dark:aria-selected:text-white",
          day_hidden: "invisible",
          ...classNames,
        } as any
      }
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
