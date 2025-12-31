

import { getCategories } from '@/lib/data';
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
import { MoreHorizontal, Component, PlusCircle, Briefcase, FileText, Shield, Computer, Wrench, Paintbrush, Book, Users, Tag, Building, Star, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { DeleteCategoryButton } from './_components/delete-category-button';
import { AddCategoryForm } from './_components/add-category-form';
import { GenerateIconsButton } from './_components/generate-icons-button';


const commonIcons: { [key: string]: React.ElementType } = {
    briefcase: Briefcase,
    filetext: FileText,
    shield: Shield,
    computer: Computer,
    wrench: Wrench,
    paintbrush: Paintbrush,
    book: Book,
    users: Users,
    tag: Tag,
    building: Building,
    star: Star,
    settings: Settings,
    component: Component,
};

const LucideIcon = ({ name, className }: { name: string; className?: string }) => {
  const normalizedName = name.toLowerCase().replace(/[-_ ]+/g, '');
  const IconComponent = commonIcons[normalizedName] || Component;
  return <IconComponent className={className} />;
};


export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Danh mục</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý danh mục sản phẩm của bạn.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <GenerateIconsButton categories={categories} />
            </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách danh mục</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Tên danh mục</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            {category.icon && <LucideIcon name={category.icon} className="h-4 w-4 text-muted-foreground" />}
                            <span>{category.name}</span>
                        </TableCell>
                        <TableCell>{category.slug}</TableCell>
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
                                <Link href={`/cms/admin/categories/${category.slug}/edit`}>Sửa</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                               <DeleteCategoryButton categorySlug={category.slug} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                     {categories.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Chưa có danh mục nào.
                            </TableCell>
                        </TableRow>
                     )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div>
            <AddCategoryForm />
        </div>
      </div>
    </div>
  );
}
