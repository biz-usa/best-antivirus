
'use client';

import type { Product, ProductVariant } from "@/lib/types";
import { Download, KeyRound, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface OrderDigitalAssetsProps {
    variant: ProductVariant | null;
}

export function OrderDigitalAssets({ variant }: OrderDigitalAssetsProps) {
    const { toast } = useToast();

    if (!variant || (!variant.downloadUrl && (!variant.licenseKeys?.available || variant.licenseKeys.available.length === 0))) {
        return <div className="text-xs text-muted-foreground">Không có</div>;
    }

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast({
            title: "Đã sao chép!",
            description: "License key đã được sao chép."
        });
    };
    
    // In a real scenario with key assignment, you'd show the assigned key.
    // For now, we'll just show the first available key as a representation.
    const representativeKey = variant.licenseKeys?.available?.[0];

    return (
        <div className="space-y-2 text-xs">
            {representativeKey && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <KeyRound className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-mono truncate flex-1" title={representativeKey}>{representativeKey}</span>
                     <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopyKey(representativeKey)}>
                        <Copy className="h-3 w-3" />
                     </Button>
                </div>
            )}
            {variant.downloadUrl && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Download className="h-3.5 w-3.5 flex-shrink-0" />
                    <a 
                        href={variant.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline truncate"
                        title={variant.downloadUrl}
                    >
                        Link tải về
                    </a>
                </div>
            )}
        </div>
    );
}
