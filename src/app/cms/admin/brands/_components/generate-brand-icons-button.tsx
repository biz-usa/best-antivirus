
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { generateAndAssignBrandIcons } from "../actions";
import type { Brand } from "@/lib/types";

interface GenerateBrandIconsButtonProps {
    brands: Brand[];
}

export function GenerateBrandIconsButton({ brands }: GenerateBrandIconsButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        // Filter to only include brands that do not have an icon
        const brandsWithoutIcons = brands.filter(c => !c.icon);
        const brandNames = brandsWithoutIcons.map(c => c.name);

        if (brandNames.length === 0) {
            toast({
                variant: 'default',
                title: "Không có thương hiệu nào cần tạo icon",
                description: "Tất cả các thương hiệu của bạn đã có icon."
            });
            return;
        }

        startTransition(async () => {
            try {
                const result = await generateAndAssignBrandIcons(brandNames);
                toast({
                    title: "Hoàn tất!",
                    description: `Đã tạo và gán icon cho ${result.updatedCount} thương hiệu.`
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: "Lỗi!",
                    description: error.message || "Không thể tạo icon bằng AI."
                });
            }
        });
    }

    return (
        <Button onClick={handleClick} disabled={isPending || brands.length === 0} variant="outline">
            {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Tạo Icon bằng AI
        </Button>
    )
}
