

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { addCategory, updateCategory } from '../actions';
import type { Category } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự.'),
  slug: z.string().min(2, 'Slug phải có ít nhất 2 ký tự.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug phải ở dạng kebab-case."),
  icon: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
    initialData?: Category | null;
}

const slugify = (str: string) => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ·/_,:;";
    const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
};


export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      icon: '',
      ...initialData,
    },
  });

  const nameValue = form.watch('name');
  useEffect(() => {
    if (form.formState.isDirty && !initialData) {
      form.setValue('slug', slugify(nameValue), { shouldValidate: true });
    }
  }, [nameValue, form, initialData]);


  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
       if (initialData) {
        await updateCategory(initialData.id, data);
        toast({
            title: 'Thành công!',
            description: 'Danh mục đã được cập nhật.',
        });
       } else {
        await addCategory(data);
        toast({
            title: 'Thành công!',
            description: 'Danh mục đã được tạo.',
        });
        form.reset();
       }
      
      router.push('/cms/admin/categories');
      router.refresh();

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Đã có lỗi xảy ra',
        description: error.message || `Không thể ${initialData ? 'cập nhật' : 'tạo'} danh mục. Vui lòng thử lại.`,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const action = initialData ? 'Lưu thay đổi' : 'Thêm danh mục';


  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tên danh mục</FormLabel>
                        <FormControl>
                        <Input placeholder="Ví dụ: Phần mềm văn phòng" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                        <Input placeholder="vi-du-phan-mem-van-phong" {...field} />
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
            </div>
            <div className="flex justify-end gap-2">
                 {initialData && <Button type="button" variant="outline" onClick={() => router.back()}>
                    Hủy
                </Button>}
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {action}
                </Button>
            </div>
        </form>
      </Form>
  );
}
