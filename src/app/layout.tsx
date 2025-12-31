
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';
import type { Metadata } from 'next'

const fontInter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
});

// Metadata is now defined at the page level.
// This layout provides the shell for the application.
export const metadata: Metadata = {
  title: {
    default: "Saigonsoft.com",
    template: `%s | Saigonsoft.com`
  },
  description: 'Saigonsoft.com - Cung cấp phần mềm bản quyền chính hãng.',
  icons: {
    icon: '/favicon.ico',
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={cn(fontInter.variable)} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
