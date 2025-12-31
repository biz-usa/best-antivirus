
'use client';

import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaleCountdownProps {
  saleEndDate: Date | string;
  className?: string;
}

export function SaleCountdown({ saleEndDate, className }: SaleCountdownProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial server render
    setIsClient(true);
  }, []);

  const calculateTimeLeft = () => {
    const difference = +new Date(saleEndDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Start the countdown timer only on the client
    if (!isClient) return;

    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];

  Object.entries(timeLeft).forEach(([interval, value]) => {
    if (value > 0) {
      timerComponents.push(
        <span key={interval} className="tabular-nums">
          {String(value).padStart(2, '0')}
          <span className="text-xs">{interval[0]}</span>
        </span>
      );
    }
  });

  if (!isClient || !timerComponents.length) {
    return null; // Return null on the server and initial client render to prevent mismatch
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <Timer className="h-4 w-4" />
      <span>Kết thúc sau:</span>
      <div className="flex items-baseline gap-1">
        {timerComponents.map((component, index) => (
            <React.Fragment key={index}>
                {component}
                {index < timerComponents.length - 1 && <span>:</span>}
            </React.Fragment>
        ))}
      </div>
    </div>
  );
}
