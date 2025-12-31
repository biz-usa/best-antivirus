
'use client';

import { ProductCard } from './product-card';
import { useProductStore } from '@/store/product';

export function ProductList() {
  const filteredProducts = useProductStore((state) => state.filteredProducts);

  return (
    <div className="space-y-8">
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} showPrice={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold">Không tìm thấy sản phẩm</h2>
          <p className="text-muted-foreground mt-2">
            Hãy thử điều chỉnh bộ lọc của bạn.
          </p>
        </div>
      )}
    </div>
  );
}
