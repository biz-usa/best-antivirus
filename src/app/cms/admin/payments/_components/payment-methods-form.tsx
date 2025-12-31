

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
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
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, Scan, Wallet, CreditCard, Save } from 'lucide-react';
import { updatePaymentMethods } from '../../actions';
import type { SiteConfig } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const paymentMethodDetailsSchema = z.object({
    enabled: z.boolean(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankShortName: z.string().optional(),
});

const disabledPaymentMethodSchema = z.object({
      enabled: z.boolean(),
});


const paymentMethodsSchema = z.object({
  paymentMethods: z.object({
    vietqr: paymentMethodDetailsSchema,
    zalopay: disabledPaymentMethodSchema,
    creditcard: disabledPaymentMethodSchema,
  }),
});

type FormValues = z.infer<typeof paymentMethodsSchema>;

interface PaymentMethodsFormProps {
  initialData: SiteConfig;
}

export function PaymentMethodsForm({ initialData }: PaymentMethodsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(paymentMethodsSchema),
    defaultValues: {
        paymentMethods: {
            vietqr: {
                enabled: initialData.paymentMethods.vietqr.enabled,
                accountName: initialData.paymentMethods.vietqr.accountName || '',
                accountNumber: initialData.paymentMethods.vietqr.accountNumber || '',
                bankShortName: initialData.paymentMethods.vietqr.bankShortName || '',
            },
            zalopay: {
                 enabled: initialData.paymentMethods.zalopay.enabled,
            },
            creditcard: {
                enabled: initialData.paymentMethods.creditcard.enabled,
            }
        }
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updatePaymentMethods(data);
        toast({
          title: 'Thành công!',
          description: 'Cài đặt cổng thanh toán đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể cập nhật cài đặt.',
        });
      }
    });
  };

  const paymentOptions = [
    { name: 'vietqr', label: 'Chuyển khoản VietQR', icon: Scan, description: 'Cho phép khách hàng thanh toán bằng cách quét mã QR từ các ứng dụng ngân hàng.' },
    { name: 'zalopay', label: 'Ví ZaloPay', icon: Wallet, description: 'Cho phép khách hàng thanh toán bằng ví điện tử ZaloPay (sắp có).' },
    { name: 'creditcard', label: 'Thẻ Tín dụng/Ghi nợ', icon: CreditCard, description: 'Cho phép khách hàng thanh toán bằng thẻ quốc tế (sắp có).' }
  ] as const;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>Quản lý Cổng thanh toán</CardTitle>
                <CardDescription>
                    Chọn các phương thức thanh toán bạn muốn cung cấp cho khách hàng và cấu hình thông tin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {paymentOptions.map((option) => (
                     <div key={option.name} className="flex flex-col rounded-lg border p-4 gap-4">
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <option.icon className="h-6 w-6 text-muted-foreground mt-1" />
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base font-medium">
                                        {option.label}
                                    </FormLabel>
                                    <FormDescription>
                                        {option.description}
                                    </FormDescription>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name={`paymentMethods.${option.name}.enabled`}
                                render={({ field }) => (
                                     <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={option.name !== 'vietqr'}
                                        />
                                    </FormControl>
                                )}
                            />
                        </div>
                        
                         {option.name === 'vietqr' && form.watch(`paymentMethods.vietqr.enabled`) && (
                            <>
                                <Separator />
                                <div className="grid md:grid-cols-2 gap-6 pl-10">
                                     <FormField
                                        control={form.control}
                                        name={`paymentMethods.vietqr.accountNumber`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Số tài khoản</FormLabel>
                                                <FormControl><Input placeholder="0123456789" {...field} value={field.value || ''} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`paymentMethods.vietqr.accountName`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tên chủ tài khoản</FormLabel>
                                                <FormControl><Input placeholder="NGUYEN VAN A" {...field} value={field.value || ''} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                     <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`paymentMethods.vietqr.bankShortName`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tên viết tắt Ngân hàng</FormLabel>
                                                    <FormDescription>Tìm mã ngân hàng của bạn tại vietqr.io. Ví dụ: Vietinbank, Techcombank, ACB.</FormDescription>
                                                    <FormControl><Input placeholder="vietinbank" {...field} value={field.value || ''} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
        <CardFooter>
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu thay đổi
            </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
