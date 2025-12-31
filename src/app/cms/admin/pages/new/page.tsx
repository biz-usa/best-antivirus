

import { NewPageForm } from "../_components/new-page-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export default function CreateNewPage() {
    
    return (
        <div className="space-y-6">
            <div>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/pages">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
                <h1 className="text-2xl font-semibold">Tạo trang mới</h1>
                <p className="text-muted-foreground mt-1">
                    Điền các thông tin bên dưới để tạo một trang nội dung tĩnh mới.
                </p>
            </div>
            <NewPageForm />
        </div>
    )
}
