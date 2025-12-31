

'use client';

import { useToast } from "@/hooks/use-toast";
import { getSiteConfig, getProducts } from "@/lib/data";
import type { Product, SiteConfig } from "@/lib/types";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function PromoToast() {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<SiteConfig['plugins']['promoToast'] | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function loadConfigAndProducts() {
      try {
        const siteConfig = await getSiteConfig();
        const promoConfig = siteConfig.plugins?.promoToast;
        const isExcluded = promoConfig?.excludedPages?.some(page => {
            const trimmedPage = page.trim();
            if (!trimmedPage) return false;
            return pathname.trim().startsWith(trimmedPage);
        }) ?? false;
        
        setIsEnabled((promoConfig?.enabled ?? false) && !isExcluded);
        setConfig(promoConfig || null);

        if (promoConfig?.enabled && !isExcluded) {
          const promoProductIds = promoConfig.productIds || [];
          if (promoProductIds.length > 0) {
            const allProducts = await getProducts();
            const productsToShow = allProducts.filter(p => promoProductIds.includes(p.id!));
            setPromoProducts(productsToShow);
          }
        }
      } catch (error) {
        console.error("Failed to load promo toast config:", error);
      }
    }
    loadConfigAndProducts();
  }, [pathname]);

  useEffect(() => {
    if (!isEnabled || promoProducts.length === 0 || !config) {
      return;
    }

    const sessionKey = 'promo-toast-shown';
    const hasBeenShown = sessionStorage.getItem(sessionKey);

    if (hasBeenShown) {
      return;
    }

    const timer = setTimeout(() => {
      const randomProduct = promoProducts[Math.floor(Math.random() * promoProducts.length)];
      
      if (randomProduct) {
          const description = (config.description || '').replace('%PRODUCT_NAME%', randomProduct.name);
          
          toast({
            duration: 8000, // Show for 8 seconds
            title: config.title || 'Ưu đãi đặc biệt ✨',
            description: description,
            action: (
              <Button asChild variant="secondary" size="sm">
                  <Link href={`/products/${randomProduct.slug}`}>Xem ngay</Link>
              </Button>
            ),
        });
        sessionStorage.setItem(sessionKey, 'true');
      }
    }, 15000); // Wait 15 seconds before showing

    return () => clearTimeout(timer);
  }, [isEnabled, promoProducts, toast, config]);

  return null; // This component does not render anything itself
}
