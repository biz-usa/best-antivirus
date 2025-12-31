

import { getAdminUsers } from "../actions";
import { ModeratorsTable } from "./_components/moderators-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { serializeForClient } from "@/lib/serializeForClient";


export default async function ModeratorsPage() {
    const rawUsers = await getAdminUsers();
    const users = serializeForClient(rawUsers);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Quản trị viên</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý và phân quyền cho các quản trị viên của trang web.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/cms/admin/moderators/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm quản trị viên
                    </Link>
                </Button>
            </div>
            <ModeratorsTable users={users} />
        </div>
    )
}


    
