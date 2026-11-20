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
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function parseDateSafe(val: Date | string | null | undefined): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return undefined;
    return val;
  }
  if (typeof val === "string") {
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

export function formatDateToYYYYMMDD(date: Date | string | null | undefined): string {
  if (!date) return "";
  if (typeof date === "string") {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayDate = React.useMemo(() => parseDateSafe(value), [value]);

  const ariaValue = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
      }
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    if (isNaN(value.getTime())) return null;
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
            !displayDate && "text-gray-500",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
          {displayDate ? (
            <span className="truncate">{format(displayDate, "PPP")}</span>
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
              const jsDate = new Date(dateValue.year, dateValue.month - 1, dateValue.day, 12, 0, 0);
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
