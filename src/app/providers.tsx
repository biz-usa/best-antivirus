

'use client';

import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import {
  AnalyticsScript,
  LivechatScript,
  PromoToast,
} from '@/plugins/registry';
import { useEffect } from 'react';

// This component is no longer needed as font loading is handled in the root layout.
function DynamicFontLoader() {
  return null;
}


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <DynamicFontLoader />
        {children}
        <Toaster />
        <PromoToast />
        <LivechatScript />
        <AnalyticsScript />
      </AuthProvider>
    </ThemeProvider>
  );
}
