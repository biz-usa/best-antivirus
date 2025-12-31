

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { useTransition } from 'react';
import { LoaderCircle, Save, PlusCircle, Trash2 } from 'lucide-react';
import type { LoyaltyTierDetails, LoyaltySettings } from '@/lib/types';
import { updateLoyaltySettings } from '../actions';
import { Separator } from '@/components/ui/separator';

const loyaltyTierSchema = z.object({
  name: z.string(), // e.g., 'Đồng'
  minPoints: z.coerce.number().min(0),
  discountPercentage: z.coerce.number().min(0).max(100),
  benefits: z.array(z.string()),
});

const formSchema = z.object({
  loyalty: z.object({
    pointConversionRate: z.coerce.number().positive(),
    tiers: z.object({
        bronze: loyaltyTierSchema,
        silver: loyaltyTierSchema,
        gold: loyaltyTierSchema,
        diamond: loyaltyTierSchema,
    }),
    resellerLoyaltyTiers: z.object({
        bronze: loyaltyTierSchema,
        silver: loyaltyTierSchema,
        gold: loyaltyTierSchema,
        diamond: loyaltyTierSchema,
    }).optional(),
  })
});

type FormValues = z.infer<typeof formSchema>;

interface LoyaltySettingsFormProps {
  initialData: LoyaltySettings;
  programType: 'customer' | 'reseller';
}

export function LoyaltySettingsForm({ initialData, programType }: LoyaltySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const isReseller = programType === 'reseller';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loyalty: {
        pointConversionRate: initialData.pointConversionRate || 0.001,
        tiers: initialData.tiers,
        resellerLoyaltyTiers: initialData.resellerLoyaltyTiers || initialData.tiers, // Fallback to customer tiers if reseller not set
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateLoyaltySettings({ loyalty: data.loyalty });
        toast({
          title: 'Thành công!',
          description: `Cài đặt chương trình cho ${isReseller ? 'Reseller' : 'Customer'} đã được cập nhật.`,
        });
        // We don't reset the form here to allow editing the other tab without losing changes
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: 'Đã có lỗi xảy ra khi cập nhật.',
        });
      }
    });
  };
  
  const tierKeys = ['bronze', 'silver', 'gold', 'diamond'] as const;
  const fieldNamePrefix = isReseller ? 'loyalty.resellerLoyaltyTiers' : 'loyalty.tiers';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
       {!isReseller && (
         <Card>
            <CardHeader>
                <CardTitle>Tỉ lệ tích điểm chung</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="loyalty.pointConversionRate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tỉ lệ quy đổi</FormLabel>
                        <FormDescription>Số điểm khách hàng nhận được cho mỗi 1,000 VNĐ chi tiêu. Áp dụng cho cả Customer và Reseller.</FormDescription>
                        <Input
                            type="number"
                            {...field}
                            value={field.value * 1000} // Display as points per 1000 VND
                            onChange={e => field.onChange(parseFloat(e.target.value) / 1000)}
                        />
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
       )}

        <Card>
          <CardHeader>
            <CardTitle>Các hạng thành viên cho {isReseller ? 'Reseller' : 'Customer'}</CardTitle>
            <CardDescription>
              Tùy chỉnh điểm yêu cầu, chiết khấu và quyền lợi cho từng hạng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {tierKeys.map((tierKey) => (
                <TierCard key={tierKey} control={form.control} tierKey={tierKey} fieldNamePrefix={fieldNamePrefix} tierName={(initialData.tiers as any)[tierKey]?.name || tierKey} />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu cài đặt
            </Button>
        </div>
      </form>
    </Form>
  );
}


function TierCard({ control, tierKey, fieldNamePrefix, tierName }: { control: any, tierKey: string, fieldNamePrefix: string, tierName: string }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `${fieldNamePrefix}.${tierKey}.benefits`,
    });

    return (
        <div className="p-4 border rounded-md space-y-4">
            <h3 className="font-semibold text-lg">Hạng {tierName}</h3>
            <div className="grid md:grid-cols-2 gap-4">
                 <FormField
                    control={control}
                    name={`${fieldNamePrefix}.${tierKey}.minPoints`}
                    render={({ field }: any) => (
                        <FormItem>
                        <FormLabel>Điểm tối thiểu</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={control}
                    name={`${fieldNamePrefix}.${tierKey}.discountPercentage`}
                    render={({ field }: any) => (
                        <FormItem>
                        <FormLabel>Chiết khấu (%)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <div>
                <FormLabel>Quyền lợi</FormLabel>
                <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <FormField
                                control={control}
                                name={`${fieldNamePrefix}.${tierKey}.benefits.${index}`}
                                render={({ field }: any) => (
                                    <Input {...field} />
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
                        <PlusCircle className="mr-2 h-4 w-4" />Thêm quyền lợi
                    </Button>
                </div>
            </div>
        </div>
    )
}
