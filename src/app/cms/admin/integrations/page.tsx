

'use client';

import { getSiteConfig } from "@/lib/data";
import { IntegrationsForm } from "./_components/integrations-form";
import { useEffect, useState } from "react";
import type { SiteConfig } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplatesForm } from "./_components/email-templates-form";


export default function AdminIntegrationsPage() {
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const siteConfig = await getSiteConfig();
                setConfig(siteConfig);
            } catch (error) {
                console.error("Failed to load site config", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);
    
    if (loading || !config) {
        return (
            <div className="space-y-6 max-w-4xl">
                 <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-full mt-2" />
                </div>
                 <div className="space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                 </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Cài đặt Tích hợp</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý cấu hình cho các dịch vụ bên thứ ba như cổng email và các API của AI.
                </p>
            </div>
            <Tabs defaultValue="provider">
                <TabsList>
                    <TabsTrigger value="provider">Cấu hình gửi Email</TabsTrigger>
                    <TabsTrigger value="templates">Mẫu Email Giao Dịch</TabsTrigger>
                </TabsList>
                <TabsContent value="provider" className="mt-6">
                    <IntegrationsForm initialData={config} />
                </TabsContent>
                <TabsContent value="templates" className="mt-6">
                    <EmailTemplatesForm initialData={config} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
