

'use client';

import { getSiteConfig, getDiscounts, getCampaignHistory } from "@/lib/data";
import { EmailCampaignForm } from "./_components/email-campaign-form";
import { CampaignHistoryTable } from "./_components/campaign-history-table";
import { serializeForClient } from "@/lib/serializeForClient";
import type { Discount, CampaignHistoryItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useToast } from "@/hooks/use-toast";

export default function AdminEmailPage() {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('compose');
    const { toast } = useToast();
    const [formState, setFormState] = useImmer({
        key: Date.now(), // Add a key to force re-mounting the form
        initialData: {
            subject: '',
            content: '',
            discountCode: 'none',
            targetAudience: 'all',
        }
    });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [rawDiscounts, historyData] = await Promise.all([
                getDiscounts(),
                getCampaignHistory()
            ]);
            setDiscounts(serializeForClient(rawDiscounts));
            setHistory(serializeForClient(historyData));
            setLoading(false);
        }
        loadData();
    }, []);

    const handleReuseCampaign = (campaign: CampaignHistoryItem) => {
        setFormState(draft => {
            draft.key = Date.now();
            draft.initialData = {
                subject: campaign.subject,
                content: campaign.content,
                discountCode: campaign.discountCode || 'none',
                targetAudience: campaign.targetAudience,
            };
        });
        setActiveTab('compose');
        toast({
            title: "Đã tải mẫu",
            description: "Nội dung chiến dịch đã được tải vào trình soạn thảo."
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Email Marketing</h1>
                <p className="text-muted-foreground mt-1">
                    Soạn, gửi và quản lý các chiến dịch email marketing của bạn.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="compose">Soạn thảo</TabsTrigger>
                    <TabsTrigger value="history">Lịch sử & Mẫu</TabsTrigger>
                </TabsList>
                <TabsContent value="compose" className="mt-6">
                     <EmailCampaignForm
                        key={formState.key}
                        discounts={discounts}
                        initialData={formState.initialData}
                    />
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    <CampaignHistoryTable
                        history={history}
                        onReuse={handleReuseCampaign}
                        loading={loading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
