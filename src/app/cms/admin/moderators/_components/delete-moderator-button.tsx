
'use client';

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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { deleteModerator } from "@/app/cms/admin/actions";

export function DeleteModeratorButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        startTransition(async () => {
            try {
                await deleteModerator(userId);
                toast({
                    title: "Thành công!",
                    description: "Quản trị viên đã được xóa."
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi!",
                    description: "Không thể xóa quản trị viên."
                });
            }
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                    disabled={isPending}
                 >
                    Xóa
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này sẽ thu hồi quyền truy cập quản trị của người dùng này.
                        Hành động này có thể được hoàn tác bằng cách thêm lại họ.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleClick} disabled={isPending}>
                     {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Tiếp tục
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

    
