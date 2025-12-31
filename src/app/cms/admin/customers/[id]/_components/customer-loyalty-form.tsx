

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserProfile, LoyaltyTier, LoyaltySettings } from '@/lib/types';
import { updateUserLoyalty } from '@/app/cms/admin/actions';
import { Input } from '@/components/ui/input';


const formSchema = z.object({
  loyaltyTier: z.string(), // Allow any string for validation, will be checked against dynamic list
  loyaltyPoints: z.coerce.number().int().min(0, "Điểm không được âm."),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerLoyaltyFormProps {
  profile: UserProfile;
  loyaltySettings: LoyaltySettings;
}

export function CustomerLoyaltyForm({ profile, loyaltySettings }: CustomerLoyaltyFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const isReseller = profile.role === 'reseller';
  const loyaltyTiers = isReseller 
    ? loyaltySettings.resellerLoyaltyTiers || loyaltySettings.tiers
    : loyaltySettings.tiers;

  const tierNames: LoyaltyTier[] = Object.values(loyaltyTiers).map(tier => tier.name).concat(['Chưa xếp hạng']);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loyaltyTier: profile.loyaltyTier || 'Chưa xếp hạng',
      loyaltyPoints: profile.loyaltyPoints || 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateUserLoyalty(profile.uid, data.loyaltyTier as LoyaltyTier, data.loyaltyPoints);
        toast({
          title: 'Thành công!',
          description: 'Thông tin khách hàng thân thiết đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể cập nhật.',
        });
      }
    });
  };
  
  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{isReseller ? 'Đối tác Thân thiết' : 'Khách hàng Thân thiết'}</CardTitle>
            <CardDescription>Chỉnh sửa hạng và điểm tích lũy của người dùng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="loyaltyTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hạng thành viên</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tierNames.map(tier => (
                        <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loyaltyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm tích lũy</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    