
'use client';

import { Star, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Review } from '@/lib/types';
import React from 'react';

interface ProductReviewSummaryProps {
  reviews: Review[];
}

export function ProductReviewSummary({ reviews }: ProductReviewSummaryProps) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>;
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return {
      star,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    };
  });

  const pros = reviews.flatMap(r => r.pros || []);
  const cons = reviews.flatMap(r => r.cons || []);

  const uniquePros = [...new Set(pros)];
  const uniqueCons = [...new Set(cons)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
                <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
                <div className="flex flex-col">
                    <div className="flex">
                        {[...Array(5)].map((_, i) => (
                             <Star key={`star-${i}`} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                    </div>
                     <p className="text-sm text-muted-foreground">Dựa trên {totalReviews} đánh giá</p>
                </div>
            </div>

             <div className="space-y-2">
                {ratingDistribution.map(item => (
                    <div key={item.star} className="flex items-center gap-2 text-sm">
                        <span>{item.star} sao</span>
                        <Progress value={item.percentage} className="w-full h-2" />
                        <span className="w-10 text-right">{item.count}</span>
                    </div>
                ))}
             </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <h4 className="font-semibold mb-2">Ưu điểm</h4>
                <ul className="space-y-2">
                    {uniquePros.slice(0, 3).map((pro, i) => (
                         <li key={`pro-${i}`} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                        </li>
                    ))}
                </ul>
             </div>
              <div>
                <h4 className="font-semibold mb-2">Nhược điểm</h4>
                 <ul className="space-y-2">
                    {uniqueCons.slice(0, 3).map((con, i) => (
                         <li key={`con-${i}`} className="flex items-start gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                            <span>{con}</span>
                        </li>
                    ))}
                </ul>
             </div>
        </div>
      </div>
    </div>
  );
}
