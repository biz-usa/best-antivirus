
'use client';

import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, EyeOff, LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProductsTableToolbarProps {
    selectedCount: number;
    onHide: () => void;
    onRestore: () => void;
    onDelete: () => void;
    isPending: boolean;
    activeTab: 'active' | 'hidden';
}

export function ProductsTableToolbar({ 
    selectedCount, 
    onHide, 
    onRestore, 
    onDelete,
    isPending,
    activeTab
}: ProductsTableToolbarProps) {
    
    const renderActiveTabActions = () => (
        <Button size="sm" variant="outline" onClick={onHide} disabled={selectedCount === 0 || isPending}>
            {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
            Ẩn ({selectedCount}) sản phẩm
        </Button>
    );

    const renderHiddenTabActions = () => (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onRestore} disabled={selectedCount === 0 || isPending}>
                 {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Hiện lại ({selectedCount})
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button size="sm" variant="destructive" disabled={selectedCount === 0 || isPending}>
                         {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Xóa vĩnh viễn ({selectedCount})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn
                            dữ liệu của các sản phẩm đã chọn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} disabled={isPending}>
                             {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Tiếp tục
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return (
        <div className="flex items-center justify-between">
            <div>
                 {selectedCount > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Đã chọn {selectedCount} sản phẩm.
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {activeTab === 'active' ? renderActiveTabActions() : renderHiddenTabActions()}
            </div>
        </div>
    )
}
