

import { getSiteConfig } from "@/lib/data";
import { AuthSettingsForm } from "./_components/auth-settings-form";

export default async function AdminAuthSettingsPage() {
    const config = await getSiteConfig();
    
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-semibold">Cài đặt Xác thực</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý các phương thức đăng nhập cho người dùng.
                </p>
            </div>
            <AuthSettingsForm initialData={config} />
        </div>
    )
}
