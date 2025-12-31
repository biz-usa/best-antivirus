
import { getCategories, getProductById, getBrands } from "@/lib/data";
import { ProductForm } from "../../_components/product-form";
import { notFound } from "next/navigation";
import { serializeForClient } from "@/lib/serializeForClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
    const { id } = await params;
    const [product, categories, brands] = await Promise.all([
        getProductById(id),
        getCategories(),
        getBrands(true)
    ]);

    if (!product) {
        notFound();
    }

    const safeProduct = serializeForClient(product);

    return (
        <div className="flex flex-col gap-6">
            <header>
                <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/products">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách sản phẩm
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Sửa sản phẩm</h1>
                <p className="text-muted-foreground mt-1">
                    Chỉnh sửa thông tin chi tiết của sản phẩm.
                </p>
            </header>
            <ProductForm initialData={safeProduct} categories={categories} brands={brands} />
        </div>
    )
}
