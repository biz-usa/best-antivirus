
'use client';

import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, Trash, LoaderCircle } from "lucide-react";
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

interface CustomersTableToolbarProps {
    selectedCount: number;
    onTrash: () => void;
    onRestore: () => void;
    onDelete: () => void;
    onEmptyTrash: () => void;
    isPending: boolean;
    activeTab: 'active' | 'trashed';
}

export function CustomersTableToolbar({ 
    selectedCount, 
    onTrash, 
    onRestore, 
    onDelete,
    onEmptyTrash,
    isPending,
    activeTab
}: CustomersTableToolbarProps) {
    
    const renderActiveTabActions = () => (
        <Button size="sm" variant="destructive" onClick={onTrash} disabled={selectedCount === 0 || isPending}>
            {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Xóa ({selectedCount})
        </Button>
    );

    const renderTrashedTabActions = () => (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onRestore} disabled={selectedCount === 0 || isPending}>
                 {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Khôi phục ({selectedCount})
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button size="sm" variant="destructive" disabled={selectedCount === 0 || isPending}>
                         {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                        Xóa vĩnh viễn ({selectedCount})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn
                            dữ liệu của khách hàng đã chọn.
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
             <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button size="sm" variant="destructive" className="bg-red-700 hover:bg-red-800" disabled={isPending}>
                         {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                        Dọn sạch thùng rác
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Dọn sạch thùng rác?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn TẤT CẢ khách hàng trong thùng rác.
                            Hành động này không thể được hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={onEmptyTrash} disabled={isPending}>
                             {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận dọn sạch
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
                        Đã chọn {selectedCount} khách hàng.
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {activeTab === 'active' ? renderActiveTabActions() : renderTrashedTabActions()}
            </div>
        </div>
    )
}
