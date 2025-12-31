
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Package, Users, CreditCard, ShoppingCart, Percent, Star, Trophy } from "lucide-react"
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import type { Order, OrderItem, Product, SiteConfig } from "@/lib/types";
import { getOrders, getProductById, getSiteConfig } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type TopProduct = Product & { purchaseCount: number };

function DashboardSkeleton() {
    return (
       <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
            </div>
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}


export default function ResellerDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<{ totalSpent: number; totalOrders: number }>({ totalSpent: 0, totalOrders: 0 });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
        if (authLoading || !user || !userProfile) return;

        setLoading(true);
        const { orders } = await getOrders({ userId: user.uid, options: { status: 'Hoàn thành' } });
        
        const totalSpent = orders.reduce((acc, order) => acc + order.total, 0);
        const totalOrders = orders.length;

        // Calculate top products
        const productCounts = new Map<string, number>();
        orders.forEach(order => {
            order.items.forEach(item => {
                productCounts.set(item.id, (productCounts.get(item.id) || 0) + item.quantity);
            });
        });
        
        const sortedProducts = Array.from(productCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        const topProductDetails: TopProduct[] = [];
        for (const [productId, count] of sortedProducts) {
            const productData = await getProductById(productId);
            if (productData) {
                topProductDetails.push({ ...productData, purchaseCount: count });
            }
        }
        
        // Get loyalty discount
        const siteConfig = await getSiteConfig();
        const resellerTiers = siteConfig.loyalty?.resellerLoyaltyTiers || siteConfig.loyalty?.tiers;
        const currentTierName = userProfile.loyaltyTier || 'Đồng';
        const currentTierDetails = Object.values(resellerTiers).find(t => t.name === currentTierName);
        setLoyaltyDiscount(currentTierDetails?.discountPercentage || 0);

        setStats({ totalSpent, totalOrders });
        setTopProducts(topProductDetails);
        setLoading(false);
    }
    
    fetchStats();
  }, [user, userProfile, authLoading]);


  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển Reseller</h1>
        <p className="mt-1 text-muted-foreground">
          Tổng quan về hoạt động kinh doanh và các ưu đãi của bạn.
        </p>
      </header>

      {loading ? <DashboardSkeleton /> : (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
                    <p className="text-xs text-muted-foreground">
                    Tổng số tiền bạn đã chi tiêu cho các đơn hàng.
                    </p>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                    Tổng số đơn hàng đã hoàn thành.
                    </p>
                </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ưu đãi hiện tại</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loyaltyDiscount}%</div>
                        <p className="text-xs text-muted-foreground">
                            Chiết khấu cho hạng <span className="font-semibold">{userProfile?.loyaltyTier}</span>.
                        </p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Sản phẩm mua nhiều nhất</CardTitle>
                    <CardDescription>
                        Top sản phẩm bạn đã mua dựa trên số lượng.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map(product => (
                                <div key={product.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary/50">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-md border object-contain"
                                    />
                                    <div className="flex-grow">
                                        <Link href={`/products/${product.slug}`} className="font-medium hover:underline">{product.name}</Link>
                                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                                    </div>
                                    <div>
                                         <Badge variant="outline">Đã mua: {product.purchaseCount}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Bạn chưa mua sản phẩm nào.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
      )}
    </div>
  )
}
