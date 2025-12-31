
import { DiscountForm } from "../_components/discount-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewDiscountPage() {
    return (
        <div className="flex flex-col gap-6">
            <header>
                <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/discounts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Tạo mã giảm giá mới</h1>
                <p className="text-muted-foreground mt-1">
                    Điền thông tin bên dưới để tạo mã giảm giá cho cửa hàng của bạn.
                </p>
            </header>
            <DiscountForm />
        </div>
    )
}
