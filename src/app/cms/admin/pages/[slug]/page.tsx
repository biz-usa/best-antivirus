
'use server';

import { getPageBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageEditorForm } from "../_components/page-editor-form";
import type { PageContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


type Props = {
    params: Promise<{ slug: string }>
}

export default async function EditPage({ params }: Props) {
    // Wait for the params to be available.
    const { slug } = await params;
    const pageData = await getPageBySlug(slug);

    if (!pageData) {
        notFound();
    }

    // Convert Timestamp to a serializable format (ISO string) if it's a Date object
    const page = {
        ...pageData,
        // The id is the slug
        id: slug,
        updatedAt: pageData.updatedAt.toDate().toISOString(),
    };
    
    return (
        <div className="space-y-6">
            <div>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/pages">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại Danh sách trang
                    </Link>
                </Button>
                <h1 className="text-2xl font-semibold">Chỉnh sửa trang: {page.title}</h1>
                <p className="text-muted-foreground mt-1">
                    Sử dụng trình soạn thảo bên dưới để cập nhật nội dung.
                </p>
            </div>
            <PageEditorForm page={page} />
        </div>
    )
}
