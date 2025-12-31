
import { notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BrandForm } from "../../_components/brand-form";
import type { Brand } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


async function getBrandById(id: string): Promise<Brand | null> {
    const docRef = doc(db, "brands", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Brand;
    } else {
        return null;
    }
}

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditBrandPage({ params }: Props) {
    const { id } = await params;
    const brand = await getBrandById(id);

    if (!brand) {
        notFound();
    }

    return (
        <div className="max-w-xl">
            <header className="mb-6">
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/brands">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Sửa thương hiệu</h1>
                <p className="text-muted-foreground mt-1">
                    Chỉnh sửa thông tin của thương hiệu.
                </p>
            </header>
            <BrandForm initialData={brand} />
        </div>
    )
}
