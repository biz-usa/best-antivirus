
'use client';

import { SiteHeader } from '@/components/site-header';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/data';
import type { FooterLinkColumn } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User, History, LayoutGrid, Trophy, LoaderCircle, Download } from 'lucide-react';


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
        <footer className="bg-secondary/70 text-secondary-foreground mt-auto no-print">
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

const resellerNavItems = [
    { href: '/reseller/dashboard', label: 'Tổng quan', icon: LayoutGrid },
    { href: '/reseller/profile', label: 'Hồ sơ Reseller', icon: User },
    { href: '/reseller/order-history', label: 'Lịch sử đơn hàng', icon: History },
    { href: '/reseller/downloads', label: 'Tải về & Giấy phép', icon: Download },
    { href: '/reseller/loyalty', label: 'Đối tác Thân thiết', icon: Trophy },
]

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, userProfile, loading } = useAuth();
    
    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'reseller')) {
            router.push('/login');
        }
    }, [user, userProfile, loading, router]);
    
    if (loading || !user || userProfile?.role !== 'reseller') {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <div className="container flex-1 py-8">
                <div className="grid md:grid-cols-4 gap-8 items-start">
                    <aside className="md:col-span-1 no-print">
                        <nav className="flex flex-col space-y-2">
                           {resellerNavItems.map(item => (
                             <Button
                                key={item.href}
                                variant={pathname.startsWith(item.href) && (item.href !== '/reseller/dashboard' || pathname === '/reseller/dashboard') ? 'default' : 'ghost'}
                                asChild
                                className="justify-start"
                             >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Link>
                            </Button>
                           ))}
                        </nav>
                    </aside>
                    <main className="md:col-span-3">
                         {children}
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
