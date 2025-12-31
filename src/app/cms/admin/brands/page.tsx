

import { getBrands } from '@/lib/data';
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
import { MoreHorizontal, PlusCircle, Component, Shield, Paintbrush, Building } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { DeleteBrandButton } from './_components/delete-brand-button';
import { BrandForm } from './_components/brand-form';
import { ImportBrandsButton } from './_components/import-brands-button';
import { GenerateBrandIconsButton } from './_components/generate-brand-icons-button';


const commonIcons: { [key: string]: React.ElementType } = {
    shield: Shield,
    paintbrush: Paintbrush,
    building: Building,
    component: Component,
};

const LucideIcon = ({ name, className }: { name: string; className?: string }) => {
  const normalizedName = name.toLowerCase().replace(/[-_ ]+/g, '');
  const IconComponent = commonIcons[normalizedName] || Component;
  return <IconComponent className={className} />;
};


export default async function AdminBrandsPage() {
  const brands = await getBrands(true); // Fetch as Brand objects

  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Thương hiệu</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý danh sách các thương hiệu sản phẩm.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <GenerateBrandIconsButton brands={brands} />
                <ImportBrandsButton />
                <Button asChild>
                    <Link href="/cms/admin/brands/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm thương hiệu
                    </Link>
                </Button>
            </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách thương hiệu</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Tên thương hiệu</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {brands.map((brand) => (
                        <TableRow key={brand.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                           {brand.icon && <LucideIcon name={brand.icon} className="h-4 w-4 text-muted-foreground" />}
                           <span>{brand.name}</span>
                        </TableCell>
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
                                <Link href={`/cms/admin/brands/${brand.id}/edit`}>Sửa</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DeleteBrandButton brandId={brand.id} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                     {brands.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                Chưa có thương hiệu nào.
                            </TableCell>
                        </TableRow>
                     )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                 <CardHeader>
                    <CardTitle>Thêm thương hiệu mới</CardTitle>
                    <CardDescription>
                        Điền tên thương hiệu bạn muốn thêm.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandForm />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
