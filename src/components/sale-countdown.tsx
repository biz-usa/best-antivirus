
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
    const timeLeft: Record<string, number> = {};

    if (difference > 0) {
      timeLeft['d'] = Math.floor(difference / (1000 * 60 * 60 * 24));
      timeLeft['h'] = Math.floor((difference / (1000 * 60 * 60)) % 24);
      timeLeft['m'] = Math.floor((difference / 1000 / 60) % 60);
      timeLeft['s'] = Math.floor((difference / 1000) % 60);
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
     // Show all units if we have time left, or filter as needed.
     // Simplified logic: show if value > 0 or if larger units exist?
     // For simplicity, just showing non-zero or all components if active.
     // But original logic was "if value > 0".
    if (timeLeft[interval] !== undefined) {
      timerComponents.push(
        <span key={interval} className="tabular-nums">
          {String(value).padStart(2, '0')}
          <span className="text-xs ml-0.5">{interval}</span>
        </span>
      );
    }
  });

  // If no time left, components empty
  if (!isClient || !Object.keys(timeLeft).length) {
    return null; 
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
