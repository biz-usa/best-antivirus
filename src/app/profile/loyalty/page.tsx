

'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Diamond, Gem, Star, Trophy } from 'lucide-react';
import { getUserProfile, getSiteConfig } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { UserProfile, LoyaltyTierDetails, SiteConfig } from '@/lib/types';
import React from 'react';
import { cn } from '@/lib/utils';

function LoyaltyPageSkeleton() {
    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-72" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-7 w-32 mt-2" />
                    <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
            </div>
        </div>
    )
}

const tierIcons: Record<string, React.ElementType> = {
    'Đồng': Star,
    'Bạc': Gem,
    'Vàng': Trophy,
    'Kim Cương': Diamond,
};


export default function LoyaltyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loyaltyConfig, setLoyaltyConfig] = useState<SiteConfig['loyalty'] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function loadData() {
            if (user) {
                setLoading(true);
                const [userProfile, siteConfig] = await Promise.all([
                    getUserProfile(user.uid),
                    getSiteConfig()
                ]);
                setProfile(userProfile);
                setLoyaltyConfig(siteConfig.loyalty);
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    if (authLoading || loading || !profile || !loyaltyConfig) {
        return <LoyaltyPageSkeleton />;
    }
    
    const isReseller = profile.role === 'reseller';
    const loyaltyTiers = isReseller 
        ? loyaltyConfig.resellerLoyaltyTiers || loyaltyConfig.tiers
        : loyaltyConfig.tiers;
    const pageTitle = isReseller ? 'Chương trình Đối tác Thân thiết' : 'Chương trình Khách hàng Thân thiết';
    
    // Sort tiers by minPoints to ensure correct progression
    const sortedTiers = Object.values(loyaltyTiers).sort((a, b) => a.minPoints - b.minPoints);

    const currentPoints = profile.loyaltyPoints || 0;
    const currentTierName = profile.loyaltyTier || 'Chưa xếp hạng';
    
    const currentTierIndex = sortedTiers.findIndex(t => t.name === currentTierName);
    const currentTierDetails = sortedTiers[currentTierIndex] || sortedTiers[0];
    
    const nextTierDetails = currentTierIndex !== -1 && currentTierIndex < sortedTiers.length - 1 
        ? sortedTiers[currentTierIndex + 1] 
        : null;

    const progressPercentage = nextTierDetails 
        ? (currentPoints / nextTierDetails.minPoints) * 100 
        : 100;

    const TierIcon = tierIcons[currentTierName] || Star;


    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                <p className="text-muted-foreground">
                    Cảm ơn bạn đã đồng hành cùng Saigonsoft.com! Tích điểm và tận hưởng các đặc quyền riêng.
                </p>
            </header>

             <Card className="text-center">
                <CardHeader className="items-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <TierIcon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mt-2">Hạng {currentTierName}</CardTitle>
                    <CardDescription className="text-lg">{currentPoints.toLocaleString()} Điểm</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    {nextTierDetails ? (
                        <>
                            <Progress value={progressPercentage} className="w-full h-2 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Bạn cần thêm <span className="font-bold text-primary">{(nextTierDetails.minPoints - currentPoints).toLocaleString()}</span> điểm để đạt hạng <span className="font-bold">{nextTierDetails.name}</span>.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm font-bold text-primary">Bạn đã đạt hạng cao nhất!</p>
                    )}
                </CardContent>
            </Card>
            
            <Separator />

             <div>
                <h2 className="text-2xl font-semibold mb-4">Quyền lợi các hạng</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sortedTiers.map((tier: LoyaltyTierDetails) => (
                        <Card key={tier.name} className={cn("flex flex-col", tier.name === currentTierName && "border-primary ring-2 ring-primary")}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                     {React.createElement(tierIcons[tier.name] || Star, { className: "h-6 w-6" })}
                                    Hạng {tier.name}
                                </CardTitle>
                                <CardDescription>Từ {tier.minPoints.toLocaleString()} điểm</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2 text-sm">
                                    {tier.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
