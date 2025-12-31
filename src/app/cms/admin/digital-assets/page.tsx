import { getProducts } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';


export default async function AdminDigitalAssetsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-8">
       <div>
            <h1 className="text-2xl font-semibold">Quản lý Tài nguyên số</h1>
            <p className="text-muted-foreground mt-1">
                Quản lý các tệp tải về, hướng dẫn và license key cho các sản phẩm của bạn.
            </p>
      </div>

      <Card>
         <CardHeader>
            <CardTitle>Danh sách sản phẩm</CardTitle>
            <CardDescription>
                Chọn một sản phẩm để quản lý các tài nguyên số liên quan.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Hình ảnh</span>
                </TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
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
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                   <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/cms/admin/digital-assets/${product.id}`}>
                                Quản lý
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                  </TableCell>
                </TableRow>
              ))}
               {products.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Chưa có sản phẩm nào.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
