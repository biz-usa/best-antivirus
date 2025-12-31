

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
import { useTransition, useState, useEffect } from 'react';
import { LoaderCircle, Save, ArrowLeft, Sparkles } from 'lucide-react';
import { createPage, generatePageContent } from '../actions';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';


const newPageSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc.'),
  slug: z.string().min(1, 'Slug là bắt buộc.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang."),
  content: z.string().min(1, 'Nội dung là bắt buộc.'),
});

type FormValues = z.infer<typeof newPageSchema>;

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


export function NewPageForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, startSavingTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');


  const form = useForm<FormValues>({
    resolver: zodResolver(newPageSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
    },
  });

  const titleValue = form.watch('title');
  useEffect(() => {
    if (form.formState.isDirty) {
        form.setValue('slug', slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, form]);


  const onSubmit = (data: FormValues) => {
    startSavingTransition(async () => {
      try {
        await createPage(data);
        toast({
          title: 'Thành công!',
          description: `Trang "${data.title}" đã được tạo.`,
        });
        router.push('/cms/admin/pages');
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể tạo trang mới.',
        });
      }
    });
  };
  
    const handleGenerateContent = async () => {
    if (!aiTopic) {
        toast({ variant: 'destructive', title: 'Vui lòng nhập chủ đề' });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generatePageContent({ topic: aiTopic });
        form.setValue('content', result.htmlContent, { shouldDirty: true });
        form.setValue('title', aiTopic, { shouldDirty: true });
        toast({
            title: 'Đã tạo nội dung!',
            description: 'AI đã điền nội dung HTML vào trình soạn thảo.'
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: error.message || 'Không thể tạo nội dung bằng AI.'
        });
    } finally {
        setIsGenerating(false);
    }
  }
  
  const isBusy = isSaving || isGenerating;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Tạo bằng AI</CardTitle>
                <CardDescription>
                   Nhập chủ đề bạn muốn viết, AI sẽ tự động tạo nội dung và tiêu đề cho trang.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <Label>Chủ đề</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                        placeholder="Ví dụ: Chính sách bảo hành phần mềm"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        disabled={isBusy}
                    />
                    <Button onClick={handleGenerateContent} disabled={isBusy || !aiTopic} className="w-full sm:w-auto" type="button">
                        {isGenerating ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Tạo nội dung
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
           <CardHeader>
                <CardTitle>Thông tin trang</CardTitle>
                 <CardDescription>
                   Điền thông tin chi tiết cho trang mới hoặc chỉnh sửa lại nội dung do AI tạo ra.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tiêu đề trang</FormLabel>
                            <FormControl>
                                <Input placeholder="Câu hỏi thường gặp" {...field} />
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
                            <FormLabel>Slug (URL)</FormLabel>
                            <FormControl>
                                <Input placeholder="cau-hoi-thuong-gap" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nội dung</FormLabel>
                        <FormControl>
                            <RichTextEditor
                                content={field.value}
                                onChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>
                <Button type="submit" disabled={isBusy || !form.formState.isDirty}>
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu trang
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
