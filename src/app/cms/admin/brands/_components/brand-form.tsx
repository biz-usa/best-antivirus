
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
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { addBrand, updateBrand } from '../actions';
import type { Brand } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(2, 'Tên thương hiệu phải có ít nhất 2 ký tự.'),
  icon: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BrandFormProps {
    initialData?: Brand | null;
}

export function BrandForm({ initialData }: BrandFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: '',
      ...initialData,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateBrand(initialData.id, data);
         toast({
            title: 'Thành công!',
            description: 'Thương hiệu đã được cập nhật.',
        });
      } else {
        await addBrand(data);
        toast({
            title: 'Thành công!',
            description: 'Thương hiệu đã được tạo.',
        });
        form.reset();
      }
      
      router.push('/cms/admin/brands');
      router.refresh();

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Đã có lỗi xảy ra',
        description: error.message || `Không thể ${initialData ? 'cập nhật' : 'tạo'} thương hiệu. Vui lòng thử lại.`,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const title = initialData ? "Sửa thương hiệu" : "Thêm thương hiệu mới";
  const description = initialData ? "Chỉnh sửa tên và icon của thương hiệu." : "Điền tên và icon cho thương hiệu bạn muốn thêm.";
  const action = initialData ? "Lưu thay đổi" : "Thêm thương hiệu";

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên thương hiệu</FormLabel>
                            <FormControl>
                            <Input placeholder="Ví dụ: Adobe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên Icon (Lucide React)</FormLabel>
                            <FormControl>
                            <Input placeholder="Ví dụ: Shield hoặc Paintbrush" {...field} />
                            </FormControl>
                             <FormDescription>
                                Tìm tên icon hợp lệ trên trang web <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a>.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {action}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>
  );
}
