'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPosition = window.scrollY;
    const progress = (scrollPosition / totalHeight) * 100;
    setScrollProgress(progress);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Progress
      value={scrollProgress}
      className="fixed top-0 left-0 w-full h-1 rounded-none bg-transparent z-50"
    />
  );
}
