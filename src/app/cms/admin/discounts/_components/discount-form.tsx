

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle, Calendar as CalendarIcon } from 'lucide-react';
import { addDiscount, updateDiscount } from '../actions';
import type { Discount } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const formSchema = z.object({
  code: z.string().min(3, "Mã code phải có ít nhất 3 ký tự.").toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive("Giá trị phải là số dương."),
  expiresAt: z.date().optional(),
  usageLimit: z.coerce.number().min(0, "Số lượng phải là số không âm.").optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DiscountFormProps {
    initialData?: Discount | null;
}

export function DiscountForm({ initialData }: DiscountFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData 
        ? {
            ...initialData,
            expiresAt: initialData.expiresAt ? new Date(initialData.expiresAt as any) : undefined
          }
        : {
            code: '',
            type: 'percentage',
            value: 10,
            usageLimit: 100,
            isActive: true,
        },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateDiscount(initialData.id!, data);
         toast({
            title: 'Thành công!',
            description: 'Mã giảm giá đã được cập nhật.',
        });
      } else {
        await addDiscount(data);
        toast({
            title: 'Thành công!',
            description: 'Mã giảm giá đã được tạo.',
        });
      }
      router.push('/cms/admin/discounts');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Đã có lỗi xảy ra',
        description: error.message || `Không thể ${initialData ? 'cập nhật' : 'tạo'} mã giảm giá.`,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const action = initialData ? "Lưu thay đổi" : "Tạo mã giảm giá";

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin mã giảm giá</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã giảm giá</FormLabel>
                                <FormControl>
                                <Input placeholder="SALE20" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Loại</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                                        <SelectItem value="fixed">Số tiền cố định (VND)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Giá trị</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="20" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Kích hoạt</FormLabel>
                                <FormDescription>
                                    Nếu tắt, mã giảm giá sẽ không thể sử dụng.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Điều kiện áp dụng (tùy chọn)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="usageLimit"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Số lần sử dụng tối đa</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="100" {...field} />
                            </FormControl>
                             <FormDescription>Để trống nếu không giới hạn.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="expiresAt"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Ngày hết hạn</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP", { locale: vi })
                                    ) : (
                                        <span>Chọn ngày</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    locale={vi}
                                    mode="single"
                                    captionLayout="dropdown-buttons"
                                    fromYear={new Date().getFullYear() - 1}
                                    toYear={new Date().getFullYear() + 10}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date < new Date(new Date().setHours(0,0,0,0))
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Mã sẽ hết hạn vào cuối ngày được chọn. Để trống nếu không có ngày hết hạn.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                    Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {action}
                </Button>
            </div>
        </form>
      </Form>
  );
}
