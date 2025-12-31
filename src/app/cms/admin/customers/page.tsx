
'use server';

import { Suspense } from "react";
import { CustomersClientPage } from "./_components/customers-client-page";
import { getAdminCustomers } from "@/lib/admin-data";
import { serializeForClient } from "@/lib/serializeForClient";

export default async function AdminCustomersPage() {
    const initialCustomers = await getAdminCustomers({ status: 'active' });

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Khách hàng</h1>
                    <p className="text-muted-foreground mt-1">
                        Xem, lọc và quản lý thông tin khách hàng của bạn.
                    </p>
                </div>
            </div>
            <Suspense fallback={<p>Đang tải danh sách khách hàng...</p>}>
                <CustomersClientPage
                    initialCustomers={serializeForClient(initialCustomers)}
                />
            </Suspense>
        </div>
    );
}
