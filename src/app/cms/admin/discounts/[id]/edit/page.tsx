
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DiscountForm } from "../../_components/discount-form";
import { getDiscountById } from "../../actions";
import { serializeForClient } from "@/lib/serializeForClient";

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditDiscountPage({ params }: Props) {
    const { id } = await params;
    const discount = await getDiscountById(id);

    if (!discount) {
        notFound();
    }
    
    const safeDiscount = serializeForClient(discount);

    return (
        <div className="max-w-xl">
            <header className="mb-6">
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/discounts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Sửa mã giảm giá</h1>
                <p className="text-muted-foreground mt-1">
                    Chỉnh sửa thông tin của mã giảm giá <span className="font-mono">{discount.code}</span>.
                </p>
            </header>
            <DiscountForm initialData={safeDiscount} />
        </div>
    )
}
