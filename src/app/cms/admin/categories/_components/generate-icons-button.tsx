
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { generateAndAssignIcons } from "../actions";
import type { Category } from "@/lib/types";

interface GenerateIconsButtonProps {
    categories: Category[];
}

export function GenerateIconsButton({ categories }: GenerateIconsButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        // Filter to only include categories that do not have an icon
        const categoriesWithoutIcons = categories.filter(c => !c.icon);
        const categoryNames = categoriesWithoutIcons.map(c => c.name);

        if (categoryNames.length === 0) {
            toast({
                variant: 'default',
                title: "Không có danh mục nào cần tạo icon",
                description: "Tất cả các danh mục của bạn đã có icon."
            });
            return;
        }

        startTransition(async () => {
            try {
                const result = await generateAndAssignIcons(categoryNames);
                toast({
                    title: "Hoàn tất!",
                    description: `Đã tạo và gán icon cho ${result.updatedCount} danh mục.`
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
        <Button onClick={handleClick} disabled={isPending || categories.length === 0} variant="outline">
            {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Tạo Icon bằng AI
        </Button>
    )
}
