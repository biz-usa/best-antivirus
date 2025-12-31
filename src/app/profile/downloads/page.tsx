
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { getOrders, getProductById } from '@/lib/data';
import type { Order, Product, ProductVariant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import {
  Download,
  ClipboardCopy,
  Info,
  Package,
  Search,
  ArrowDownUp,
  X,
  History,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
import { GuideViewer } from './_components/guide-viewer';


// Type for a flattened, display-ready purchased item
type PurchasedItem = {
  product: Product;
  variant: ProductVariant;
  orderId: string;
  orderDate: Date;
  licenseKeys: string[];
};

function DownloadsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, j) => (
          <Card key={j}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter className="gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    // Handles Firestore Timestamps, ISO strings, and Date objects
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) {
        try {
            // Fallback for ISO strings that might not be directly constructible
            const parsed = Date.parse(dateInput);
            if (!isNaN(parsed)) {
                return new Intl.DateTimeFormat('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).format(new Date(parsed));
            }
        } catch (e) {
            return 'Invalid Date';
        }
        return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};


function DownloadsPageComponent() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdFilter = searchParams.get('orderId');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const { toast } = useToast();
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchPurchasedItems() {
      if (user) {
        setIsFetching(true);
        const { orders: userOrders } = await getOrders({ userId: user.uid });
        const filteredOrders = userOrders.filter(
          (o) => o.status === 'Hoàn thành' && o.items.length > 0
        );
        setOrders(filteredOrders);
        setIsFetching(false);
      }
    }
    fetchPurchasedItems();
  }, [user]);

  const allPurchasedItems = useMemo(async () => {
    const flattenedItems: PurchasedItem[] = [];
    const ordersToProcess = orderIdFilter 
      ? orders.filter(o => o.id === orderIdFilter) 
      : orders;

    for (const order of ordersToProcess) {
      for (const item of order.items) {
        const product = await getProductById(item.id);
        if (product) {
          const variant = product.variants.find(v => v.id === item.variantId);
          if (variant) {
            const licenseKeys = variant.licenseKeys?.used
              ?.filter(uk => uk.orderId === order.id && uk.customerId === user!.uid)
              .map(uk => uk.key) || [];
            
            // Ensure orderDate is a valid Date object
            const orderDate = order.createdAt instanceof Date 
                ? order.createdAt 
                : (order.createdAt as any).toDate ? (order.createdAt as any).toDate() : new Date(order.createdAt as any);

            flattenedItems.push({
              product,
              variant,
              orderId: order.id,
              orderDate: orderDate,
              licenseKeys,
            });
          }
        }
      }
    }
    return flattenedItems;
  }, [orders, user, orderIdFilter]);

  const [resolvedItems, setResolvedItems] = useState<PurchasedItem[]>([]);

  useEffect(() => {
      allPurchasedItems.then(items => {
          let filteredItems = items.filter(item => {
            const query = debouncedSearchQuery.toLowerCase();
            if (!query) return true;

            const productNameMatch = item.product.name.toLowerCase().includes(query);
            const orderIdMatch = item.orderId.toLowerCase().includes(query);
            const licenseKeyMatch = item.licenseKeys.some(key => key.toLowerCase().includes(query));
            
            return productNameMatch || orderIdMatch || licenseKeyMatch;
          });

          filteredItems.sort((a, b) => {
              switch (sortBy) {
                  case 'date_asc':
                      return a.orderDate.getTime() - b.orderDate.getTime();
                  case 'name_asc':
                      return a.product.name.localeCompare(b.product.name);
                  case 'name_desc':
                      return b.product.name.localeCompare(a.product.name);
                  case 'date_desc':
                  default:
                      return b.orderDate.getTime() - a.orderDate.getTime();
              }
          });
          
          setResolvedItems(filteredItems);
      });
  }, [allPurchasedItems, debouncedSearchQuery, sortBy]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Đã sao chép!',
      description: 'License key đã được sao chép vào bộ nhớ tạm.',
    });
  };
  
  if (loading || !user) {
    return <DownloadsPageSkeleton />;
  }
  
  const sortOptions = {
    date_desc: 'Ngày mua: Mới nhất',
    date_asc: 'Ngày mua: Cũ nhất',
    name_asc: 'Tên sản phẩm: A-Z',
    name_desc: 'Tên sản phẩm: Z-A',
  };
  
  const basePath = userProfile?.role === 'reseller' ? '/reseller' : '/profile';
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Tải về & Giấy phép
        </h1>
        <p className="mt-1 text-muted-foreground">
          {orderIdFilter 
            ? `Hiển thị các sản phẩm cho đơn hàng ${orderIdFilter}.`
            : "Quản lý các sản phẩm bạn đã mua, tải xuống và xem license key."
          }
        </p>
      </header>
      
       {orderIdFilter && (
        <div className="space-y-4">
          <Button asChild variant="outline">
            <Link href={`${basePath}/downloads`}>
              <X className="mr-2 h-4 w-4" />
              Bỏ lọc và xem tất cả sản phẩm
            </Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, đơn hàng, hoặc license..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              <span>
                Sắp xếp theo:{' '}
                {sortOptions[sortBy as keyof typeof sortOptions]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Tùy chọn sắp xếp</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <DropdownMenuRadioItem value="date_desc">
                Ngày mua: Mới nhất
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date_asc">
                Ngày mua: Cũ nhất
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name_asc">
                Tên sản phẩm: A-Z
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name_desc">
                Tên sản phẩm: Z-A
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isFetching ? (
        <DownloadsPageSkeleton />
      ) : (
        <>
          {resolvedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resolvedItems.map((item, index) => (
                <AlertDialog key={`${item.product.id}-${item.variant.id}-${index}`}>
                  <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                      <div className="p-2 border rounded-lg bg-secondary/50">
                        <BrandLogo
                          brand={item.product.brand}
                          className="h-8 w-8 text-muted-foreground"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base leading-tight">
                          {item.product.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                        <CardDescription className="text-xs mt-1">
                          Đơn hàng:{' '}
                          <Link href={`${basePath}/order-history/${item.orderId}`} className="font-mono hover:underline">{item.orderId}</Link> |{' '}
                          {formatDate(item.orderDate)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      {item.licenseKeys.length > 0 ? (
                        <div>
                          <p className="text-sm font-semibold mb-2">
                            License Key(s)
                          </p>
                          <div className="space-y-2">
                            {item.licenseKeys.map((key, keyIndex) => (
                              <div
                                key={keyIndex}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  readOnly
                                  value={key}
                                  className="flex-grow bg-muted border rounded-md px-3 py-1 text-xs font-mono"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => handleCopyKey(key)}
                                >
                                  <ClipboardCopy className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-muted-foreground py-4">
                          Chưa có license key.
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="gap-2 bg-secondary/30 p-4 mt-4">
                      <Button
                        className="flex-1"
                        asChild
                        disabled={!item.variant.downloadUrl}
                      >
                        <a
                          href={item.variant.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Tải về
                        </a>
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          disabled={!item.product.guide}
                        >
                          <Info className="mr-2 h-4 w-4" />
                          Hướng dẫn
                        </Button>
                      </AlertDialogTrigger>
                    </CardFooter>
                  </Card>
                  {item.product.guide && (
                    <GuideViewer guideContent={item.product.guide} productName={item.product.name} />
                  )}
                </AlertDialog>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Package className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="mt-6 text-2xl font-semibold">
                Không tìm thấy sản phẩm
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {debouncedSearchQuery
                  ? 'Không có sản phẩm nào khớp với tìm kiếm của bạn.'
                  : orderIdFilter
                  ? 'Không tìm thấy sản phẩm cho đơn hàng này.'
                  : 'Các sản phẩm trong những đơn hàng đã được xử lý hoàn tất sẽ xuất hiện ở đây.'}
              </p>
              {!debouncedSearchQuery && !orderIdFilter && (
                <Button asChild className="mt-6">
                  <Link href="/products">Bắt đầu mua sắm</Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}


export default function DownloadsPage() {
  return (
    <Suspense fallback={<DownloadsPageSkeleton />}>
      <DownloadsPageComponent />
    </Suspense>
  )
}
