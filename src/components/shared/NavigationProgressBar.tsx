"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";

export function NavigationProgressBar() {
  const { isNavigating } = useNavigationLoading();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isNavigating) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      setProgress(20);

      const t1 = setTimeout(() => {
        setProgress(45);
      }, 150);

      const t2 = setTimeout(() => {
        setProgress(75);
      }, 400);

      const t3 = setTimeout(() => {
        setProgress(88);
      }, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      if (!visible) return;

      // Complete the bar
      setProgress(100);

      const fadeTimer = setTimeout(() => {
        setVisible(false);
        const resetTimer = setTimeout(() => {
          setProgress(0);
        }, 200);
        return () => clearTimeout(resetTimer);
      }, 200);

      return () => clearTimeout(fadeTimer);
    }
  }, [isNavigating, visible]);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Navigation loading"
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionProperty: "width, opacity",
          transitionDuration: progress === 100 ? "150ms, 200ms" : "300ms, 150ms",
        }}
      />
    </div>
  );
}
