'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy } from "lucide-react";

interface CopyButtonProps {
    textToCopy: string;
}

export function CopyButton({ textToCopy }: CopyButtonProps) {
    const { toast } = useToast();

    const handleCopy = async () => {
        let success = false;
        
        // Method 1: Try modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(textToCopy);
                success = true;
            } catch (err) {
                console.warn("Clipboard API failed, trying fallback...", err);
            }
        }

        // Method 2: Fallback to execCommand
        if (!success) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                
                // Ensure it's not visible but part of the DOM
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                textArea.setAttribute('readonly', ''); // Avoid screen keyboard on mobile
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                success = document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch (err) {
                 console.error("Fallback copy failed", err);
            }
        }

        if (success) {
            toast({
                title: "Đã sao chép!",
                description: "Thông tin đã được sao chép vào bộ nhớ tạm.",
            });
        } else {
             toast({
                variant: "destructive",
                title: "Lỗi!",
                description: "Không thể sao chép. Vui lòng thử thủ công.",
            });
        }
    };
    
    return (
         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            <ClipboardCopy className="h-4 w-4" />
        </Button>
    )
}
