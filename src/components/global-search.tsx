

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, LoaderCircle, ExternalLink } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import Link from 'next/link';

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);


export function GlobalSearch({ onSelect }: { onSelect?: () => void }) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchTerm] = useDebounce(inputValue, 300);
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const products = await getProducts();
        setAllProducts(products);
      } catch (error) {
        console.error('Failed to fetch products for search:', error);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
        setLoading(true);
        const lowerCaseTerm = debouncedSearchTerm.toLowerCase();
        const filtered = allProducts
          .filter(product =>
            product.name.toLowerCase().includes(lowerCaseTerm) ||
            product.brand.toLowerCase().includes(lowerCaseTerm) ||
            product.category.name.toLowerCase().includes(lowerCaseTerm)
          )
          .slice(0, 7);
        
        setResults(filtered);
        setLoading(false);
    } else {
        setResults([]);
    }
  }, [debouncedSearchTerm, allProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
            setIsFocused(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleSelection = () => {
      setInputValue('');
      setIsFocused(false);
      onSelect?.();
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(inputValue) {
        router.push(`/products?search=${encodeURIComponent(inputValue)}`);
        handleSelection();
    }
  }

  return (
    <div className="relative w-full max-w-md" ref={searchWrapperRef}>
      <form className="relative w-full" onSubmit={handleFormSubmit}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-9"
        />
        {loading && inputValue && (
            <LoaderCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </form>
       {isFocused && inputValue && (
         <div className="absolute top-full mt-2 w-full z-50 rounded-lg border bg-background shadow-lg overflow-hidden">
            <div className="divide-y max-h-[70vh] overflow-y-auto">
            {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Đang tìm...</div>
            ) : results.length > 0 ? (
                <>
                    {results.map((product) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="block p-3 hover:bg-accent"
                            onClick={handleSelection}
                        >
                            <div className="flex items-center gap-4">
                                <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="rounded-md object-contain border aspect-square"
                                />
                                <div className="flex-1">
                                <p className="font-semibold text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.category.name}</p>
                                </div>
                                <p className="text-sm font-medium">{formatCurrency(product.variants?.[0]?.salePrice || product.variants?.[0]?.price || 0)}</p>
                            </div>
                        </Link>
                    ))}
                    <div className="p-2">
                        <button onClick={handleFormSubmit} className="w-full text-sm text-center p-2 rounded-md hover:bg-accent text-primary font-medium flex items-center justify-center gap-2">
                            Xem tất cả kết quả <ExternalLink className="h-4 w-4" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    Không tìm thấy sản phẩm nào khớp.
                </div>
            )}
            </div>
        </div>
      )}
    </div>
  );
}
