
'use client';

import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, XCircle, LoaderCircle } from "lucide-react";
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

interface OrderTableToolbarProps {
    selectedCount: number;
    onCancel: () => void;
    onRestore: () => void;
    onDelete: () => void;
    isPending: boolean;
    activeStatus?: string;
}

export function OrderTableToolbar({ 
    selectedCount, 
    onCancel,
    onRestore,
    onDelete,
    isPending,
    activeStatus
}: OrderTableToolbarProps) {
    
    const isTrashedView = activeStatus === 'Đã hủy';

    const renderActiveTabActions = () => (
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={selectedCount === 0 || isPending}>
                    {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Hủy ({selectedCount}) đơn hàng
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn hủy?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này sẽ chuyển các đơn hàng đã chọn vào mục "Đã hủy". Bạn có thể khôi phục chúng sau này.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Bỏ qua</AlertDialogCancel>
                    <AlertDialogAction onClick={onCancel} disabled={isPending}>
                         {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận Hủy
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
                         {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Xóa vĩnh viễn ({selectedCount})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn
                            dữ liệu của các đơn hàng đã chọn.
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
                        Đã chọn {selectedCount} đơn hàng.
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {isTrashedView ? renderTrashedTabActions() : renderActiveTabActions()}
            </div>
        </div>
    )
}
