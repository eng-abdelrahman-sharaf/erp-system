"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Calendar } from "@/components/ui/Calendar";
import { CalendarDate, type DateValue } from "@internationalized/date";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const ariaValue = React.useMemo(() => {
    if (!value || isNaN(value.getTime())) return null;
    return new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-start rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-left shadow-xs hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-gray-500",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
          {value ? (
            <span className="truncate">{format(value, "PPP")}</span>
          ) : (
            <span className="truncate text-gray-500">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          value={ariaValue}
          onChange={(dateValue: DateValue) => {
            if (!dateValue) {
              onChange?.(undefined);
            } else {
              const jsDate = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
              onChange?.(jsDate);
            }
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
