

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getProducts, getSiteConfig } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import { ArrowRight, CaseSensitive, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import type { FooterLinkColumn, Product, SiteConfig } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
        <footer className="bg-secondary/20 text-secondary-foreground">
            <div className="container py-12">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-8 text-sm">
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

const LucideIcon = ({ name, className }: { name: string, className?: string }) => {
  const toPascalCase = (str: string) =>
    str
      .toLowerCase()
      .split(/[-_ ]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
      
  const pascalCaseName = toPascalCase(name);
  const IconComponent = (Icons as any)[pascalCaseName];

  if (!IconComponent) {
    return <Icons.Component className={className} />; // Fallback icon
  }
  return <IconComponent className={className} />;
};



export default function LandingPage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      async function loadData() {
          setLoading(true);
          try {
              const [allProducts, config] = await Promise.all([
                  getProducts(undefined, { status: 'active' }), // Only fetch active products
                  getSiteConfig()
              ]);
              
              const featuredIds = config.featuredProducts?.productIds || [];
              const productsToShow = allProducts.filter(p => featuredIds.includes(p.id!));
              
              setFeaturedProducts(productsToShow);
              setSiteConfig(config);
          } catch (error) {
              console.error("Failed to load landing page data:", error);
          } finally {
              setLoading(false);
          }
      }
      loadData();
  }, []);

  const heroConfig = siteConfig?.hero;
  const show3DGrid = heroConfig?.backgroundType === '3d-grid' || heroConfig?.backgroundType === 'image-with-3d-overlay';
  const showImage = heroConfig?.backgroundType === 'image' || heroConfig?.backgroundType === 'image-with-3d-overlay';

  return (
    <div className="flex flex-col min-h-screen text-foreground">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] md:h-screen flex items-center justify-center text-center overflow-hidden">
             {show3DGrid && <div className="hero-bg"></div>}
             {showImage && heroConfig?.imageUrl && (
                <Image
                    src={heroConfig.imageUrl}
                    alt={heroConfig.title}
                    fill
                    className="object-cover"
                    priority
                />
             )}
              <div className={cn(
                "relative z-10 p-4 max-w-4xl mx-auto text-foreground",
                showImage ? "bg-background/70 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl" : "hero-card"
              )}>
                 {loading || !siteConfig ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4 mx-auto bg-gray-500/20" />
                        <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-gray-500/20" />
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                            {siteConfig.hero.title}
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-foreground/80">
                            {siteConfig.hero.subtitle}
                        </p>
                    </>
                )}
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="text-primary-foreground">
                    <Link href="/products">Khám phá sản phẩm</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-transparent backdrop-blur-none text-foreground hover:bg-foreground/5">
                    <Link href="/category/kinh-doanh-ke-toan">
                        Dành cho doanh nghiệp
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
            </div>
        </section>


        {/* Secondary Features Section */}
         <section className="py-12">
            <div className="container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {siteConfig?.secondaryFeatures?.map((feature) => (
                        <div key={feature.title} className="flex flex-col items-center">
                            <LucideIcon name={feature.icon} className="h-6 w-6 text-primary" />
                            <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                            <Button variant="link" asChild className="text-primary mt-1">
                                <Link href={feature.href}>{feature.linkText} <ArrowRight className="ml-1 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>

         {/* Popular Categories Section */}
        <section className="py-16 md:py-24">
            <div className="container">
                 {loading || !siteConfig ? (
                    <div className="max-w-3xl mb-12 text-center mx-auto">
                        <Skeleton className="h-10 w-2/3 mx-auto" />
                        <Skeleton className="h-5 w-full mt-4 mx-auto" />
                    </div>
                 ) : (
                    <div className="max-w-3xl mb-12 text-center mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{siteConfig.popularCategories.title}</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                           {siteConfig.popularCategories.subtitle}
                        </p>
                    </div>
                 )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {siteConfig?.popularCategories.categories.map((category) => (
                        <Link key={category.slug} href={`/category/${category.slug}`} className="block group">
                            <div className="p-6 border rounded-lg flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary h-full">
                                <LucideIcon name={category.icon} className="h-8 w-8 text-primary" />
                                <h3 className="mt-4 font-semibold text-base group-hover:text-primary">{category.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>


        {/* Featured Products Section */}
        <section id="products" className="py-16 md:py-24 bg-secondary/20">
          <div className="container">
            <div className="max-w-3xl mb-12 text-center mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{siteConfig?.featuredProducts.title || 'Sản phẩm nổi bật'}</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                 {siteConfig?.featuredProducts.subtitle || 'Các phần mềm được tin dùng và bán chạy nhất tại Saigonsoft.com.'}
              </p>
            </div>
             {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}><CardContent className="p-4"><Skeleton className="aspect-video" /></CardContent></Card>
                    ))}
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} showPrice={true} />
                    ))}
                </div>
             )}
            <div className="text-center mt-12">
              <Button asChild variant="default" size="lg">
                <Link href="/products">
                  Xem tất cả sản phẩm
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="py-16 md:py-24">
            <div className="container">
                <div className="max-w-3xl mb-12 text-center mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{siteConfig?.partners.title || 'Đối tác của chúng tôi'}</h2>
                </div>
                {loading || !siteConfig ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12">
                        {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 items-center justify-items-center gap-x-8 gap-y-12">
                        {siteConfig.partners.logos.map((partner) => (
                            <BrandLogo key={partner.brand} brand={partner.brand} className="h-10 w-24 object-contain text-muted-foreground transition-all hover:text-foreground" />
                        ))}
                    </div>
                )}
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
