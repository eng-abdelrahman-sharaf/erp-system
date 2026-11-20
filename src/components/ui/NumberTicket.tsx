"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface NumberTicketProps {
  value: number;
  duration?: number;
  className?: string;
  isCurrency?: boolean;
  suffix?: string;
  prefix?: string;
  showDecimals?: boolean;
  decimalPlaces?: number;
}

export function NumberTicket({
  value,
  duration = 2000,
  className,
  isCurrency = false,
  suffix = "",
  prefix = "",
  showDecimals = false,
  decimalPlaces = 2,
}: NumberTicketProps) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Easing function for smooth animation
      const easeOutExpo =
        percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      const animatedValue = value * easeOutExpo;

      setCurrentValue(animatedValue);

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrentValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  const formatValue = isCurrency
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(currentValue)
    : showDecimals
      ? `${prefix}${currentValue.toFixed(decimalPlaces)}${suffix}`
      : `${prefix}${Math.ceil(currentValue).toLocaleString()}${suffix}`;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-gray-100 to-gray-200 px-6 py-4 text-gray-900  transition-all dark:from-gray-800 dark:to-gray-900 dark:text-white",
        className,
      )}
    >
      <span className="relative text-3xl font-bold tracking-tight">
        {formatValue}
      </span>
    </div>
  );
}
