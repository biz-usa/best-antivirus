
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
import { deletePage } from "../actions";

export function DeletePageButton({ slug }: { slug: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        startTransition(async () => {
            try {
                await deletePage(slug);
                toast({
                    title: "Thành công!",
                    description: "Trang đã được xóa."
                });
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi!",
                    description: error.message || "Không thể xóa trang. Vui lòng thử lại."
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
                        Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn
                        trang này khỏi máy chủ.
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
