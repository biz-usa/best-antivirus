

'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Copy, Package, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DeleteProductButton } from './delete-product-button';
import type { Product } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductsTableProps {
    data: Product[];
    onActionComplete: () => void;
    selectedProductIds: string[];
    setSelectedProductIds: (ids: string[]) => void;
}

export default function ProductsTable({ data: products, onActionComplete, selectedProductIds, setSelectedProductIds }: ProductsTableProps) {
    
    const isAllSelected = products.length > 0 && selectedProductIds.length === products.length;

    const handleSelectAll = (checked: boolean) => {
        setSelectedProductIds(checked ? products.map(p => p.id!) : []);
    };
    
    const handleSelectOne = (id: string, checked: boolean) => {
        setSelectedProductIds(
            checked 
                ? [...selectedProductIds, id] 
                : selectedProductIds.filter(pid => pid !== id)
        );
    };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Hình ảnh</span>
          </TableHead>
          <TableHead>Tên sản phẩm</TableHead>
          <TableHead>Thương hiệu</TableHead>
           <TableHead>Trạng thái</TableHead>
          <TableHead>
            <span className="sr-only">Hành động</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} data-state={selectedProductIds.includes(product.id!) ? 'selected' : ''}>
            <TableCell><Checkbox checked={selectedProductIds.includes(product.id!)} onCheckedChange={(checked) => handleSelectOne(product.id!, !!checked)} /></TableCell>
            <TableCell className="hidden sm:table-cell">
              <Image
                alt={product.name}
                className="aspect-square rounded-md object-cover"
                height="64"
                src={product.imageUrl}
                width="64"
                data-ai-hint={product.imageHint}
              />
            </TableCell>
            <TableCell className="font-medium">
              <Link href={`/products/${product.slug}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                {product.name}
              </Link>
            </TableCell>
            <TableCell>{product.brand}</TableCell>
            <TableCell><Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={cn(product.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300')}>{product.status === 'active' ? 'Đang hoạt động' : 'Đã ẩn'}</Badge></TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                   <DropdownMenuItem asChild>
                        <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" />
                            Xem trên trang
                        </a>
                    </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/cms/admin/products/${product.id}/edit`}>Sửa</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DeleteProductButton productId={product.id!} onSuccess={onActionComplete} />
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              Chưa có sản phẩm nào.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}


