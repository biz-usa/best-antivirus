
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import Link from 'next/link';
import type { FooterLinkColumn } from '@/lib/types';
import { getSiteConfig } from '@/lib/data';
import { LoaderCircle } from 'lucide-react';


function Footer() {
    const { user, userProfile } = useAuth();
    const [columns, setColumns] = useState<FooterLinkColumn[]>([]);
    
    useEffect(() => {
        async function fetchConfig() {
            const config = await getSiteConfig();
            let footerColumns = config?.footer?.linkColumns || [];
            
            // Filter columns based on auth status
            if (!user) {
                footerColumns = footerColumns.filter(col => !col.authRequired);
            }
            
            // Adjust links based on user role
            const basePath = userProfile?.role === 'reseller' ? '/reseller' : '/profile';
            footerColumns = footerColumns.map(column => ({
                ...column,
                links: column.links.map(link => {
                    if (link.href.includes('/order-history')) {
                        return { ...link, href: `${basePath}/order-history` };
                    }
                    if (link.href.includes('/downloads')) {
                        return { ...link, href: `${basePath}/downloads` };
                    }
                    return link;
                })
            }));

            setColumns(footerColumns);
        }
        fetchConfig();
    }, [user, userProfile]);
    
    return (
        <footer className="bg-secondary/70 text-secondary-foreground mt-auto">
            <div className="container py-12">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 text-sm text-left">
                    {columns.map((column) => (
                        <div key={column.title} className="col-span-2 md:col-span-1">
                            <h3 className="font-semibold mb-4 text-foreground">{column.title}</h3>
                            <ul className="space-y-2">
                                {column.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-muted-foreground hover:underline">
                                            {link.text}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-12 border-t pt-8 flex flex-col justify-between items-center text-xs text-muted-foreground gap-4">
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                    <Link href="/pages/contact" className="hover:underline">Liên hệ Saigonsoft.com</Link>
                    <Link href="/pages/privacy-policy" className="hover:underline">Quyền riêng tư</Link>
                    <Link href="/pages/terms-of-use" className="hover:underline">Điều khoản sử dụng</Link>
                    <Link href="/pages/trademarks" className="hover:underline">Thương hiệu</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} Saigonsoft.com</p>
                <p>SG e-Commerce Platform v1.2</p>
            </div>
            </div>
        </footer>
    );
}


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if user is logged in AND not on the forgot-password page
    if (!loading && user && userProfile && pathname !== '/forgot-password') {
      if (user.email === 'admin@example.com') {
         router.push('/cms/admin');
      } else if (userProfile.role === 'reseller') {
          router.push('/reseller/dashboard');
      } else {
         router.push('/profile/order-history');
      }
    }
  }, [user, userProfile, loading, router, pathname]);
  
  if (loading || (user && userProfile && pathname !== '/forgot-password')) {
     return (
        <div className="flex flex-col min-h-screen items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Đang chuyển hướng...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
