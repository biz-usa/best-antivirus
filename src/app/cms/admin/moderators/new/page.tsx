

import { ModeratorForm } from "@/app/cms/admin/moderators/_components/moderator-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export default function NewModeratorPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <header>
                <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/moderators">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
                 <h1 className="text-2xl font-semibold">Thêm quản trị viên mới</h1>
                <p className="text-muted-foreground mt-1">
                    Nhập email của người dùng và chọn vai trò cũng như quyền hạn cho họ.
                </p>
            </header>
            <ModeratorForm />
        </div>
    )
}
