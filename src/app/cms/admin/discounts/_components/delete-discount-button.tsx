
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
import { deleteDiscount } from "../actions";

export function DeleteDiscountButton({ discountId }: { discountId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        startTransition(async () => {
            try {
                await deleteDiscount(discountId);
                toast({
                    title: "Thành công!",
                    description: "Mã giảm giá đã được xóa."
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi!",
                    description: "Không thể xóa mã giảm giá."
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
                        mã giảm giá này.
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
