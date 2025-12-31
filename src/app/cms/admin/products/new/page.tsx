import { getCategories, getBrands } from "@/lib/data";
import { ProductForm } from "../_components/product-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export default async function NewProductPage() {
    const [categories, brands] = await Promise.all([
        getCategories(),
        getBrands(true)
    ]);

    return (
        <div className="flex flex-col gap-6">
            <header>
                <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/products">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách sản phẩm
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Thêm sản phẩm mới</h1>
                <p className="text-muted-foreground mt-1">
                    Điền vào biểu mẫu dưới đây để tạo một sản phẩm mới, hoặc sử dụng AI để tự động điền.
                </p>
            </header>
            <ProductForm categories={categories} brands={brands} />
        </div>
    )
}
