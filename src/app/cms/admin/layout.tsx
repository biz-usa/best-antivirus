
'use client';

import Link from 'next/link';
import {
  Home,
  Package2,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Building,
  Archive,
  Paintbrush,
  CreditCard,
  Mail,
  FileText,
  Lock,
  Download,
  Settings,
  Puzzle,
  Share2,
  TicketPercent,
  UserCog,
  ReceiptText,
  Eye,
  Sun,
  Moon,
  Trophy,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SiteConfig } from '@/lib/types';
import { getSiteConfig } from '@/lib/data';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const navItems = [
    { href: '/cms/admin', icon: Home, label: 'Tổng quan' },
    { href: '/cms/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
    { href: '/cms/admin/products', icon: Package, label: 'Sản phẩm' },
    { href: '/cms/admin/discounts', icon: TicketPercent, label: 'Mã giảm giá' },
    { href: '/cms/admin/digital-assets', icon: Archive, label: 'Tài nguyên số' },
    { href: '/cms/admin/customers', icon: Users, label: 'Khách hàng' },
    { href: '/cms/admin/loyalty', icon: Trophy, label: 'Khách hàng Thân thiết'},
    { href: '/cms/admin/pages', icon: FileText, label: 'Trang nội dung' },
    { href: '/cms/admin/categories', icon: Tag, label: 'Danh mục' },
    { href: '/cms/admin/brands', icon: Building, label: 'Thương hiệu' },
    { href: '/cms/admin/email', icon: Mail, label: 'Chiến dịch Email' },
    { href: '/cms/admin/plugins', icon: Puzzle, label: 'Plugin & Add-ons' },
];

const settingsNavItems = [
     { href: '/cms/admin/appearance', icon: Paintbrush, label: 'Giao diện' },
     { href: '/cms/admin/product-feeds', icon: Download, label: 'Xuất dữ liệu' },
     { href: '/cms/admin/authentication', icon: Lock, label: 'Xác thực' },
     { href: '/cms/admin/payments', icon: CreditCard, label: 'Cổng thanh toán' },
     { href: '/cms/admin/tax', icon: ReceiptText, label: 'Thuế' },
     { href: '/cms/admin/integrations', icon: Share2, label: 'Tích hợp & API' },
     { href: '/cms/admin/moderators', icon: UserCog, label: 'Quản trị viên' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const { setTheme, theme } = useTheme();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.email !== 'admin@example.com') {
                router.push('/');
            }
        }
    }, [user, loading, router]);
    
     useEffect(() => {
        async function fetchConfig() {
            try {
                setIsConfigLoading(true);
                const siteConfig = await getSiteConfig();
                setConfig(siteConfig);
            } catch (error) {
                console.error("Failed to fetch site config for admin layout", error);
            } finally {
                setIsConfigLoading(false);
            }
        }
        fetchConfig();
    }, []);

    if (loading || !user || user.email !== 'admin@example.com') {
        return null; // or a loading spinner
    }

    const handleSignOut = async () => {
        await signOut();
        toast({
          title: 'Đã đăng xuất',
          description: 'Bạn đã đăng xuất thành công.',
        });
        router.push('/');
      };

    const logoUrl = theme === 'dark' ? config?.header.logoDarkUrl : config?.header.logoLightUrl;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar side="left" collapsible="icon">
          <SidebarHeader>
              <div className="flex items-center gap-2 h-8 justify-center group-data-[state=expanded]:justify-start" data-sidebar="logo">
                  {isConfigLoading ? (
                      <Skeleton className="h-8 w-full group-data-[state=collapsed]:w-8" />
                  ) : logoUrl ? (
                    <>
                      <Image 
                          src={logoUrl} 
                          alt="Logo" 
                          width={144} 
                          height={32} 
                          className="h-8 w-auto hidden group-data-[state=expanded]:block" 
                      />
                      <Package2 className="h-6 w-6 block group-data-[state=expanded]:hidden" />
                    </>
                  ) : (
                      <>
                          <Package2 className="h-6 w-6" />
                          <span className="font-semibold text-lg hidden group-data-[state=expanded]:inline">Admin CMS</span>
                      </>
                  )}
              </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                      <SidebarMenuButton isActive={pathname.startsWith(item.href) && (item.href !== '/cms/admin' || pathname === '/cms/admin')} tooltip={item.label}>
                          <item.icon />
                          <span>{item.label}</span>
                      </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <SidebarMenuButton tooltip="Cài đặt hệ thống">
                              <Settings />
                              <span>Cài đặt</span>
                          </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                          {settingsNavItems.map(item => (
                              <DropdownMenuItem key={item.href} asChild>
                                  <Link href={item.href}>
                                      <item.icon className="mr-2 h-4 w-4" />
                                      {item.label}
                                  </Link>
                              </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 no-print">
                <SidebarTrigger />
                <div className="flex-1">
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/" target="_blank">
                                <Eye className="h-5 w-5" />
                                <span className="sr-only">Xem trang chủ</span>
                            </Link>
                        </Button>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                    <Users className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Đăng xuất</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
                <footer className="text-center text-xs text-muted-foreground mt-auto pt-4 no-print">
                SGecom v1.2 by J.L
                </footer>
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
