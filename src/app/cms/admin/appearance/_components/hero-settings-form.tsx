
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState, useEffect } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { updateAppearance } from '../../actions';
import type { SiteConfig } from '@/lib/types';
import { FileUploader } from './file-uploader';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateHeroImage } from '../../products/actions';

const heroSettingsSchema = z.object({
  hero: z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc'),
    subtitle: z.string().min(1, 'Phụ đề là bắt buộc'),
    backgroundType: z.enum(['3d-grid', 'image', 'image-with-3d-overlay']).default('3d-grid'),
    imageUrl: z.string().default(''),
  }),
});

type FormValues = z.infer<typeof heroSettingsSchema>;

interface HeroSettingsFormProps {
  siteConfig: SiteConfig;
}

export function HeroSettingsForm({ siteConfig }: HeroSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const initialData = siteConfig.hero;
  const [aiPrompt, setAiPrompt] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(heroSettingsSchema),
    defaultValues: {
      hero: {
        title: initialData?.title || '',
        subtitle: initialData?.subtitle || '',
        backgroundType: initialData?.backgroundType || '3d-grid',
        imageUrl: initialData?.imageUrl || '',
      }
    },
  });
  
  useEffect(() => {
    // Generate an initial smart prompt when the component loads
    const title = form.getValues('hero.title');
    const subtitle = form.getValues('hero.subtitle');
    const categoryNames = siteConfig.popularCategories?.categories.map(c => c.name).join(', ') || '';
    const productNames = siteConfig.featuredProducts?.productIds.slice(0, 3).join(', ') || '';
    const slogan = siteConfig.companyInfo?.slogan || '';
    const smartPrompt = `technology website hero, ${title}, ${subtitle}, ${slogan}, concepts: ${categoryNames}, ${productNames}, software, digital products`;
    setAiPrompt(smartPrompt);
  }, [siteConfig, form]);


  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Khu vực Hero đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: 'Đã có lỗi xảy ra khi cập nhật.',
        });
      }
    });
  };

  const handleGenerateImage = async () => {
      if (!aiPrompt) {
          toast({
              variant: 'destructive',
              title: 'Thiếu thông tin',
              description: 'Vui lòng nhập prompt trước khi tạo ảnh.'
          });
          return;
      }
      setIsGenerating(true);
      try {
          const result = await generateHeroImage(aiPrompt);
          form.setValue('hero.imageUrl', result.imageUrl, { shouldDirty: true });
          toast({
              title: 'Đã tạo ảnh!',
              description: 'Ảnh nền đã được tạo và cập nhật vào biểu mẫu.'
          });
      } catch(e: any) {
          toast({
              variant: 'destructive',
              title: 'Lỗi tạo ảnh',
              description: e.message || 'Không thể tạo ảnh bằng AI. Vui lòng thử lại.'
          });
      } finally {
          setIsGenerating(false);
      }
  }

  const backgroundType = form.watch('hero.backgroundType');
  const isBusy = isPending || isGenerating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Nội dung khu vực Hero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="hero.title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề chính</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hero.subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phụ đề</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Nền khu vực Hero</CardTitle>
                <FormDescription>
                    Tùy chỉnh nền cho khu vực hiển thị đầu trang.
                </FormDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="hero.backgroundType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Loại nền</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn một loại nền" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="3d-grid">Hiệu ứng lưới 3D</SelectItem>
                                <SelectItem value="image">Chỉ hình ảnh</SelectItem>
                                <SelectItem value="image-with-3d-overlay">Hình ảnh với lớp phủ 3D</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 {(backgroundType === 'image' || backgroundType === 'image-with-3d-overlay') && (
                     <>
                        <div className="space-y-2">
                           <FormLabel>Tạo ảnh bằng AI</FormLabel>
                           <FormDescription>Nhập prompt (câu lệnh) bằng tiếng Anh để AI tạo ảnh, hoặc chỉnh sửa prompt gợi ý.</FormDescription>
                           <div className="flex gap-2">
                                <Input 
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ví dụ: technology, software, abstract, blue theme"
                                    disabled={isBusy}
                                />
                                <Button type="button" onClick={handleGenerateImage} disabled={isBusy || !aiPrompt}>
                                    {isGenerating ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    Tạo
                                </Button>
                           </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="hero.imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL Hình ảnh nền</FormLabel>
                                    <FormControl>
                                    <FileUploader
                                        value={field.value || ''}
                                        onValueChange={field.onChange}
                                        folder="site_assets"
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                 )}
            </CardContent>
        </Card>

        <Button type="submit" disabled={isBusy || !form.formState.isDirty}>
          {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Lưu thay đổi
        </Button>
      </form>
    </Form>
  );
}
