

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { generateProductComparison } from '@/ai/flows/product-comparison-generator';
import type { ProductComparisonOutput, CompetitorInfo } from '@/lib/schemas/product-comparison';
import { Bot, Check, Info, ArrowRight, History } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { BrandLogo } from './brand-logo';
import { getProducts } from '@/lib/data';
import { Checkbox } from './ui/checkbox';
import Image from 'next/image';
import { useComparisonHistoryStore } from '@/store/comparison-history';

interface ProductComparisonProps {
  product: Product;
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

export function ProductComparison({ product }: ProductComparisonProps) {
  const [comparison, setComparison] = useState<ProductComparisonOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [potentialCompetitors, setPotentialCompetitors] = useState<Product[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Product[]>([]);
  const [view, setView] = useState<'select' | 'result'>('select');
  const [isFromCache, setIsFromCache] = useState(false);
  const { toast } = useToast();
  const { getComparison, addComparison } = useComparisonHistoryStore();


   useEffect(() => {
    async function fetchCompetitors() {
      setIsLoading(true);
      try {
        const categoryProducts = await getProducts(product.category.slug);
        const competitors = categoryProducts.filter(p => p.id !== product.id);
        setPotentialCompetitors(competitors);
      } catch (error) {
        console.error("Failed to fetch potential competitors:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompetitors();
  }, [product]);

  const handleToggleCompetitor = (competitor: Product) => {
    setSelectedCompetitors(prev => 
      prev.some(p => p.id === competitor.id)
        ? prev.filter(p => p.id !== competitor.id)
        : [...prev, competitor]
    );
  };


  const handleCompare = async () => {
    if (selectedCompetitors.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Chưa chọn sản phẩm',
            description: 'Vui lòng chọn ít nhất một sản phẩm để so sánh.'
        });
        return;
    }
    
    // Check cache first
    const cachedResult = getComparison(product, selectedCompetitors);
    if (cachedResult) {
        setComparison(cachedResult);
        setIsFromCache(true);
        setView('result');
        return;
    }

    setIsLoading(true);
    setComparison(null);
    setIsFromCache(false);
    setView('result');

    try {
       const competitorInfo: CompetitorInfo[] = selectedCompetitors.map(c => ({
            name: c.name,
            brand: c.brand,
            price: c.variants?.[0]?.price ?? 0,
            shortDescription: c.shortDescription
        }));

      const result = await generateProductComparison({
        productName: product.name,
        productBrand: product.brand,
        productPrice: product.variants?.[0]?.price ?? 0,
        productShortDescription: product.shortDescription,
        competitors: competitorInfo,
      });
      setComparison(result);
      addComparison(product, selectedCompetitors, result); // Save to cache
    } catch (error) {
      console.error('Comparison generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description:
          'Không thể tạo so sánh. Vui lòng thử lại sau.',
      });
      setView('select'); // Go back to selection on error
    } finally {
      setIsLoading(false);
    }
  };

  const allProductsInComparison = comparison
    ? [comparison.mainProduct, ...comparison.competitors]
    : [];
  
  const renderSelection = () => (
     <div className="space-y-6">
       <div className="p-6 border-2 border-dashed rounded-lg">
          <div className="text-center mb-6">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="mt-4 font-semibold">Chọn sản phẩm để so sánh</p>
              <p className="mt-1 text-sm text-muted-foreground">
                  Chọn các sản phẩm cùng danh mục bên dưới, sau đó để AI phân tích và so sánh chúng.
              </p>
          </div>
          {potentialCompetitors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {potentialCompetitors.map(p => (
                      <div key={p.id} className="flex items-start space-x-3 p-3 border rounded-md has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-colors">
                          <Checkbox 
                              id={`competitor-${p.id}`} 
                              checked={selectedCompetitors.some(sp => sp.id === p.id)}
                              onCheckedChange={() => handleToggleCompetitor(p)}
                          />
                          <div className="grid gap-1.5 leading-none">
                              <label htmlFor={`competitor-${p.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                  {p.name}
                              </label>
                              <p className="text-xs text-muted-foreground">{p.brand}</p>
                          </div>
                      </div>
                  ))}
              </div>
          ) : isLoading ? <Skeleton className="h-24 w-full" /> : <p className="text-center text-sm text-muted-foreground">Không có sản phẩm nào khác trong danh mục này để so sánh.</p>}
       </div>
       <div className="flex justify-end">
          <Button onClick={handleCompare} disabled={isLoading || selectedCompetitors.length === 0}>
              So sánh {selectedCompetitors.length > 0 ? `${selectedCompetitors.length} sản phẩm` : ''}
              <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
       </div>
    </div>
  )

  const renderResult = () => (
     <div>
        {isLoading && <ComparisonSkeleton />}
        {comparison && (
            <div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Tiêu chí</TableHead>
                            {allProductsInComparison.map((p) => (
                                <TableHead key={p.name}>
                                     <div className="flex items-center gap-2">
                                        <BrandLogo brand={p.brand} className="h-5 w-5" />
                                        <div>
                                            <p className="font-semibold">{p.name}</p>
                                             {p.name === product.name && <Badge variant="secondary" className="text-xs">Sản phẩm này</Badge>}
                                        </div>
                                     </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-semibold">Giá tham khảo</TableCell>
                            {allProductsInComparison.map(p => (
                                <TableCell key={p.name} className="font-semibold text-primary">{formatCurrency(p.price)}</TableCell>
                            ))}
                        </TableRow>
                        {comparison.comparison.map((row) => (
                            <TableRow key={row.feature}>
                                <TableCell className="font-semibold">{row.feature}</TableCell>
                                <TableCell>{row.mainProductValue}</TableCell>
                                {row.competitorValues.map(compVal => (
                                    <TableCell key={compVal.competitorName}>{compVal.value}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Thông tin so sánh được tạo bởi AI và chỉ mang tính chất tham khảo.</span>
                    </div>
                     {isFromCache && (
                        <Badge variant="outline" className="flex items-center gap-1.5">
                            <History className="h-3 w-3" />
                            Lấy từ bộ nhớ đệm
                        </Badge>
                     )}
                </div>
                 <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={() => setView('select')}>Quay lại chọn sản phẩm</Button>
                </div>
            </div>
        )}
     </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>So sánh sản phẩm với sản phẩm cùng tính năng</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chọn các sản phẩm để so sánh, sau đó AI sẽ phân tích và đưa ra bảng so sánh chi tiết.
        </p>
      </CardHeader>
      <CardContent>
        {view === 'select' ? renderSelection() : renderResult()}
      </CardContent>
    </Card>
  );
}
