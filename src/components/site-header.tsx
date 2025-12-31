

'use client';

import { Search, UserCircle, LogOut, History, User, Menu, X, LayoutDashboard, Download, BookMarked, Sun, Moon, Laptop, Heart, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { CartButton } from './cart-button';
import { NotificationBell } from './notification-bell';
import { GlobalSearch } from './global-search';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { getSiteConfig } from '@/lib/data';
import type { SiteConfig, NavLink } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CurrencySwitcher } from './currency-switcher';


export function SiteHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);

   useEffect(() => {
        async function fetchConfig() {
            const siteConfig = await getSiteConfig();
            setConfig(siteConfig);
        }
        fetchConfig();
    }, []);

    const logoUrl = theme === 'dark' ? config?.header.logoDarkUrl : config?.header.logoLightUrl;
    
    // Logic to prepend /pages to nav links if needed
    const navLinks = config?.header.navLinks.map(link => {
        const isExternal = link.href.startsWith('http');
        // Define which routes are "special" and should not be prepended with /pages
        const specialRoutes = ['/', '/products', '/documents', '/wishlist'];
        const isSpecialRoute = specialRoutes.includes(link.href) || link.href.startsWith('/category') || link.href.startsWith('/pages/');

        if (isExternal || isSpecialRoute) {
            return link;
        }
        // For all other links, prepend /pages
        return {
            ...link,
            href: `/pages${link.href.startsWith('/') ? '' : '/'}${link.href}`
        };
    }) || [];


  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);


  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Đã đăng xuất',
      description: 'Bạn đã đăng xuất thành công.',
    });
    router.push('/');
    router.refresh();
  };
  
  const isAdmin = user && user.email === 'admin@example.com';
  const isReseller = userProfile?.role === 'reseller';

  const navLinksContent = (
    <>
      {navLinks.map((link: NavLink) => (
        <Link 
          key={link.href} 
          href={link.href} 
          className="text-sm font-medium text-foreground transition-colors hover:text-primary" 
          onClick={() => setIsMenuOpen(false)}>
            {link.text}
        </Link>
      ))}
    </>
  )

  const renderUserMenuItems = () => {
      if (isAdmin) {
          return (
              <DropdownMenuItem asChild>
                <Link href="/cms/admin">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Trang quản trị
                </Link>
              </DropdownMenuItem>
          )
      }
      if (isReseller) {
          return (
             <>
                <DropdownMenuItem asChild><Link href="/reseller/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Bảng điều khiển</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/reseller/profile"><User className="mr-2 h-4 w-4" />Hồ sơ Reseller</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/reseller/order-history"><History className="mr-2 h-4 w-4" />Lịch sử đơn hàng</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/reseller/loyalty"><Trophy className="mr-2 h-4 w-4" />Đối tác Thân thiết</Link></DropdownMenuItem>
             </>
          )
      }
      // Default to customer
      return (
          <>
            <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" />Hồ sơ</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/profile/order-history"><History className="mr-2 h-4 w-4" />Đơn hàng</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/profile/downloads"><Download className="mr-2 h-4 w-4" />Tải về</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/profile/wishlist"><Heart className="mr-2 h-4 w-4" />Yêu thích</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/profile/loyalty"><Trophy className="mr-2 h-4 w-4" />Khách hàng Thân thiết</Link></DropdownMenuItem>
          </>
      )
  }

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", "no-print")}>
      <div className="container flex h-16 items-center">
        <div className="flex items-center space-x-2 md:space-x-4">
             <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-4">
                 <div className="flex justify-between items-center mb-6">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                       {logoUrl && <Image src={logoUrl} alt="Saigonsoft.com Logo" width={150} height={30} className="h-8" style={{ width: 'auto' }} />}
                    </Link>
                     <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                        </Button>
                     </SheetClose>
                 </div>
                 <nav className="flex flex-col gap-4 mt-6">
                    {navLinksContent}
                 </nav>
              </SheetContent>
            </Sheet>
            <Link href="/" className="mr-2 flex items-center space-x-2">
                 {logoUrl && <Image src={logoUrl} alt="Saigonsoft.com Logo" width={180} height={36} className="h-9" style={{ width: 'auto' }} />}
            </Link>
             <nav className="hidden md:flex gap-6">
                {navLinksContent}
            </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-1 md:space-x-2">
            <div className="hidden md:block flex-1 mx-4">
              <GlobalSearch />
            </div>
            
             <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Tìm kiếm</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="p-4 top-20 translate-y-[-50%] sm:top-1/4">
                    <DialogHeader>
                        <DialogTitle>Tìm kiếm</DialogTitle>
                        <DialogDescription className="sr-only">Tìm kiếm sản phẩm trên toàn bộ trang web.</DialogDescription>
                    </DialogHeader>
                    <GlobalSearch onSelect={() => setIsSearchOpen(false)} />
                </DialogContent>
            </Dialog>

             <NotificationBell />
             <CartButton />
             <CurrencySwitcher />

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
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {loading ? (
                  <DropdownMenuLabel>Đang tải...</DropdownMenuLabel>
                ) : user ? (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || 'Người dùng'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {renderUserMenuItems()}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Đăng xuất</DropdownMenuItem>
                  </>
                ) : (
                   <>
                    <DropdownMenuItem asChild><Link href="/login">Đăng nhập</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/register">Tạo tài khoản</Link></DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
