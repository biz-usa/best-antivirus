
'use client';

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function ImportExcelButton() {
    const handleImport = () => {
        // Placeholder logic
        alert("Tính năng nhập Excel đang phát triển.");
    };

    return (
        <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Nhập Excel
        </Button>
    )
}
