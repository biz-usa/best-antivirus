
import { BrandForm } from "../_components/brand-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export default async function NewBrandPage() {
    return (
        <div className="flex flex-col gap-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/brands">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Thêm thương hiệu mới</h1>
                <p className="text-muted-foreground mt-1">
                    Điền thông tin bên dưới để tạo một thương hiệu mới.
                </p>
            </header>
            <BrandForm />
        </div>
    )
}
