
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
import { CategoryForm } from "../../_components/category-form";
import type { Category } from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await getCategories();
    const category = categories.find(c => c.slug === slug);
    return category || null;
}

type Props = {
    params: Promise<{ slug: string }>
}

export default async function EditCategoryPage({ params }: Props) {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    if (!category) {
        notFound();
    }

    return (
        <div className="max-w-xl">
             <header className="mb-6">
                <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/categories">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Sửa danh mục</h1>
                <p className="text-muted-foreground mt-1">
                    Chỉnh sửa thông tin của danh mục.
                </p>
            </header>
            <Card>
                <CardContent className="pt-6">
                    <CategoryForm initialData={category} />
                </CardContent>
            </Card>
        </div>
    )
}
