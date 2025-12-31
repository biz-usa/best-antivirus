

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Category, Product, Brand, ProductVariant } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addProduct, updateProduct, generateProductVariants, generateProductDetails, generateScreenshots, generateProductSeoContent } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { LoaderCircle, Sparkles, Eye, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { nanoid } from 'nanoid';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { vi } from 'date-fns/locale';
import { FileUploader } from '../../appearance/_components/file-uploader';
import { useDebounce } from 'use-debounce';


const variantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên biến thể là bắt buộc"),
  price: z.coerce.number().min(0, "Giá phải là số dương"),
  resellerPrice: z.coerce.number().min(0, "Giá reseller phải là số dương").optional().or(z.literal(0)).or(z.literal('')),
  salePrice: z.coerce.number().min(0, "Giá sale phải là số dương").optional().or(z.literal('')),
  saleStartDate: z.date().optional(),
  saleEndDate: z.date().optional(),
  sku: z.string().min(1, "SKU là bắt buộc"),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});


const formSchema = z.object({
  name: z.string().min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự.'),
  slug: z.string().min(3, 'Slug phải có ít nhất 3 ký tự.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug phải ở dạng kebab-case."),
  brand: z.string().min(1, 'Vui lòng chọn thương hiệu.'),
  categoryId: z.string({ required_error: 'Vui lòng chọn danh mục.'}),
  shortDescription: z.string().min(10, 'Mô tả ngắn phải có ít nhất 10 ký tự.'),
  longDescription: z.string().min(20, 'Mô tả chi tiết phải có ít nhất 20 ký tự.'),
  mfr: z.string().min(1, 'MFR không được để trống.'),
  imageUrl: z.string().url('URL hình ảnh không hợp lệ.').or(z.string().startsWith('data:image')).or(z.literal('')),
  imageHint: z.string().optional(),
  licenseType: z.enum(['Subscription', 'Perpetual']),
  screenshots: z.array(z.string().url('URL không hợp lệ nếu không phải chuỗi rỗng').or(z.string().startsWith('data:image')).or(z.literal(''))).optional(),
  variants: z.array(variantSchema).min(1, "Sản phẩm phải có ít nhất một biến thể."),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  categories: Category[];
  brands: Brand[];
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

export function ProductForm({ initialData, categories, brands }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isGeneratingScreenshots, setIsGeneratingScreenshots] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [aiProductName, setAiProductName] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const formAction = initialData ? 'edit' : 'create';
  const LOCAL_STORAGE_KEY = `product-form-draft-${formAction}`;


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          categoryId: initialData.category.slug,
          variants: initialData.variants?.map(v => ({ 
              ...v, 
              resellerPrice: v.resellerPrice ?? '',
              salePrice: v.salePrice ?? '',
              saleStartDate: v.saleStartDate ? new Date(v.saleStartDate as any) : undefined,
              saleEndDate: v.saleEndDate ? new Date(v.saleEndDate as any) : undefined,
          })) || [],
           screenshots: [
            initialData.screenshots?.[0] || '',
            initialData.screenshots?.[1] || '',
            initialData.screenshots?.[2] || '',
            initialData.screenshots?.[3] || '',
            initialData.screenshots?.[4] || '',
          ]
        }
      : {
          name: '',
          slug: '',
          brand: '',
          categoryId: '',
          shortDescription: '',
          longDescription: '',
          mfr: '',
          imageUrl: '',
          imageHint: 'software product box',
          licenseType: 'Subscription',
          screenshots: ['', '', '', '', ''],
          variants: [{ id: nanoid(8), name: 'Mặc định', price: 0, resellerPrice: '', salePrice: '', sku: '', attributes: [] }],
          seoTitle: '',
          seoDescription: '',
        },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "variants"
  });
  
  const watchedValues = form.watch();
  const [debouncedValues] = useDebounce(watchedValues, 1500);

  // Load from localStorage on mount
  useEffect(() => {
    if (formAction === 'create') {
        const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsedDraft = JSON.parse(savedDraft);
                 // Convert date strings back to Date objects
                if (parsedDraft.variants) {
                    parsedDraft.variants.forEach((v: any) => {
                        if (v.saleStartDate) v.saleStartDate = new Date(v.saleStartDate);
                        if (v.saleEndDate) v.saleEndDate = new Date(v.saleEndDate);
                    });
                }
                form.reset(parsedDraft);
                toast({ title: "Đã khôi phục bản nháp", description: "Nội dung sản phẩm chưa lưu đã được tải lại." });
            } catch (error) {
                console.error("Failed to parse product draft from localStorage", error);
            }
        }
    }
  }, [form, toast, LOCAL_STORAGE_KEY, formAction]);


    // Save to localStorage on change
  useEffect(() => {
    if (form.formState.isDirty) {
        setAutoSaveStatus('saving');
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(debouncedValues));
        const timer = setTimeout(() => setAutoSaveStatus('saved'), 500);
        const idleTimer = setTimeout(() => setAutoSaveStatus('idle'), 2500);
        return () => {
            clearTimeout(timer);
            clearTimeout(idleTimer);
        }
    }
  }, [debouncedValues, form.formState.isDirty, LOCAL_STORAGE_KEY]);

  const handleClearDraft = () => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      form.reset({
          name: '', slug: '', brand: '', categoryId: '', shortDescription: '', longDescription: '', mfr: '',
          imageUrl: '', imageHint: 'software product box', licenseType: 'Subscription',
          screenshots: ['', '', '', '', ''],
          variants: [{ id: nanoid(8), name: 'Mặc định', price: 0, resellerPrice: '', salePrice: '', sku: '', attributes: [] }],
          seoTitle: '', seoDescription: '',
      });
      toast({ title: "Đã xóa bản nháp", description: "Nội dung đã được làm mới." });
  };


  const nameValue = form.watch('name');
  useEffect(() => {
    if (!initialData && form.formState.isDirty) { // Only auto-slugify for new products and if user has interacted
      form.setValue('slug', slugify(nameValue), { shouldValidate: true });
    }
  }, [nameValue, initialData, form.setValue, form.formState.isDirty]);

  useEffect(() => {
    if (initialData) {
      setAiProductName(initialData.name);
    }
  }, [initialData]);

  const productSuggestions = useMemo(() => {
    const suggestions: { [key: string]: string[] } = {
        'Microsoft': ['Microsoft 365 Family', 'Microsoft Office Home & Student 2021', 'Windows 11 Pro', 'Microsoft Project Standard'],
        'Autodesk': ['AutoCAD LT 2025', 'Autodesk Fusion', 'Revit 2025', '3ds Max'],
        'Adobe': ['Adobe Photoshop', 'Adobe Acrobat Pro', 'Adobe Creative Cloud'],
        'Kaspersky': ['Kaspersky Total Security', 'Kaspersky Internet Security'],
    };
    
    // Flatten the suggestions and add other brands
    const brandNames = brands.map(b => b.name);
    let allSuggestions: string[] = [];

    for (const brand of brandNames) {
        if (suggestions[brand]) {
            allSuggestions.push(...suggestions[brand]);
        }
    }
    // Limit to a reasonable number
    return allSuggestions.slice(0, 10);
  }, [brands]);


  const handleGenerateDetails = async () => {
    if (!aiProductName) {
        toast({
            variant: 'destructive',
            title: 'Vui lòng nhập tên sản phẩm',
            description: 'Bạn cần nhập tên sản phẩm để AI có thể tạo chi tiết.'
        });
        return;
    }
    setIsGeneratingDetails(true);
    try {
        const result = await generateProductDetails({ 
          name: aiProductName,
          categories: categories.map(({id, name, slug}) => ({id, name, slug}))
        });
        const { details, imageUrl } = result;
        
        // Get current variants before resetting the form
        const currentVariants = form.getValues('variants');

        form.reset({
            ...form.getValues(), // Keep current form values
            name: details.name,
            slug: slugify(details.name),
            brand: details.brand,
            categoryId: details.categoryId,
            shortDescription: details.shortDescription,
            longDescription: details.longDescription,
            mfr: details.mfr,
            imageHint: details.imageHint,
            imageUrl: imageUrl,
            variants: currentVariants, // Keep the existing variants
        });

        toast({
            title: 'Đã tạo chi tiết sản phẩm!',
            description: 'AI đã điền các thông tin vào biểu mẫu. Hãy xem lại trước khi lưu.',
        });

    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Lỗi tạo chi tiết sản phẩm',
            description: 'Đã có lỗi xảy ra khi dùng AI. Vui lòng thử lại.',
        });
    } finally {
        setIsGeneratingDetails(false);
    }
  };

  const handleGenerateScreenshots = async () => {
    const productName = form.getValues('name');
    const productDescription = form.getValues('shortDescription');

    if (!productName || !productDescription) {
        toast({
            variant: 'destructive',
            title: 'Thiếu thông tin sản phẩm',
            description: 'Vui lòng điền Tên sản phẩm và Mô tả ngắn trước khi tạo ảnh chụp màn hình.'
        });
        return;
    }

    setIsGeneratingScreenshots(true);
    try {
        const { screenshotUrls } = await generateScreenshots({ productName, productDescription });
        
        form.setValue('screenshots', screenshotUrls as [string, string, string, string, string], { shouldValidate: true });

        toast({
            title: 'Đã tạo ảnh chụp màn hình!',
            description: 'AI đã điền 5 ảnh chụp màn hình vào biểu mẫu.',
        });

    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Lỗi tạo ảnh',
            description: 'Đã có lỗi xảy ra khi tạo ảnh chụp màn hình. Vui lòng thử lại.',
        });
    } finally {
        setIsGeneratingScreenshots(false);
    }
  };

   const handleGenerateVariants = async () => {
    const productName = form.getValues('name');
    const licenseType = form.getValues('licenseType');
    const brand = form.getValues('brand');

    if (!productName) {
        toast({
            variant: 'destructive',
            title: 'Thiếu tên sản phẩm',
            description: 'Vui lòng điền tên sản phẩm trước khi tạo biến thể.'
        });
        return;
    }
    setIsGeneratingVariants(true);
    try {
      const result = await generateProductVariants({ productName, licenseType, brand });
      
      const newVariants = result.variants.map(v => ({
          ...v,
          resellerPrice: '', // Add resellerPrice field
          salePrice: v.salePrice || '',
      }));

      replace(newVariants);
      
      toast({
        title: 'Đã tạo biến thể!',
        description: `AI đã tạo ${result.variants.length} biến thể cho sản phẩm.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi tạo biến thể',
        description: error.message || 'Không thể tạo biến thể bằng AI. Vui lòng thử lại.',
      });
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleGenerateSeo = async () => {
    const name = form.getValues('name');
    const description = form.getValues('shortDescription');
    if (!name || !description) {
        toast({ variant: 'destructive', title: "Thiếu thông tin", description: "Vui lòng nhập tên và mô tả ngắn cho sản phẩm." });
        return;
    }
    setIsGeneratingSeo(true);
    try {
        const result = await generateProductSeoContent({ productName: name, productDescription: description });
        form.setValue('seoTitle', result.seoTitle, { shouldDirty: true });
        form.setValue('seoDescription', result.seoDescription, { shouldDirty: true });
        toast({ title: 'Đã tạo nội dung SEO!', description: 'AI đã tạo và điền vào các trường SEO.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Lỗi', description: error.message || 'Không thể tạo nội dung SEO.' });
    } finally {
        setIsGeneratingSeo(false);
    }
  }


  const onSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);
    const submissionData = {...data, screenshots: data.screenshots?.filter(url => url && url.trim() !== '')};
    
    try {
        if (initialData) {
            await updateProduct(initialData.id!, submissionData as any);
            toast({
                title: 'Thành công!',
                description: 'Sản phẩm đã được cập nhật thành công.',
            });
        } else {
            await addProduct(submissionData as any);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear draft on successful creation
            toast({
                title: 'Thành công!',
                description: 'Sản phẩm đã được tạo thành công.',
            });
        }
      
      router.push('/cms/admin/products');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Đã có lỗi xảy ra',
        description: `Không thể ${initialData ? 'cập nhật' : 'tạo'} sản phẩm. Vui lòng thử lại.`,
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const titleText = initialData ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới';
  const description = initialData ? 'Chỉnh sửa thông tin chi tiết của sản phẩm.' : 'Điền vào biểu mẫu dưới đây để tạo một sản phẩm mới.';
  const action = initialData ? 'Lưu thay đổi' : 'Tạo sản phẩm';
  const isGenerating = isGeneratingDetails || isGeneratingScreenshots || isGeneratingVariants || isGeneratingSeo;

  return (
    <>
    <Dialog open={!!previewImageUrl} onOpenChange={(isOpen) => !isOpen && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Xem trước hình ảnh</DialogTitle>
                <DialogDescription>Xem trước hình ảnh đã chọn.</DialogDescription>
            </DialogHeader>
            {previewImageUrl && (
            <Image
                src={previewImageUrl}
                alt="Image Preview"
                width={1200}
                height={800}
                className="w-full h-auto object-contain rounded-md"
            />
            )}
        </DialogContent>
    </Dialog>

    <div className="space-y-8">
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Tạo bằng Trí tuệ nhân tạo</CardTitle>
                        <CardDescription>
                            Nhập tên sản phẩm và để AI tự động điền hoặc cập nhật các chi tiết còn lại cho bạn.
                        </CardDescription>
                    </div>
                    {!initialData && (
                        <div className="flex items-center gap-2">
                             <div className="text-xs text-muted-foreground transition-opacity duration-300">
                                {autoSaveStatus === 'saving' && <span className="flex items-center gap-1"><LoaderCircle className="h-3 w-3 animate-spin" /> Đang lưu...</span>}
                                {autoSaveStatus === 'saved' && <span className="text-green-600">Đã lưu bản nháp.</span>}
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={handleClearDraft} className="text-destructive hover:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa bản nháp
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                    placeholder="Ví dụ: Photoshop Elements 2024"
                    value={aiProductName}
                    onChange={(e) => setAiProductName(e.target.value)}
                    disabled={isGenerating}
                    />
                    <Button onClick={handleGenerateDetails} disabled={isGenerating} className="w-full sm:w-auto">
                    {isGeneratingDetails ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Tạo nội dung
                    </Button>
                </div>
                 {productSuggestions.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Gợi ý:</span>
                        {productSuggestions.map(suggestion => (
                            <Badge 
                                key={suggestion} 
                                variant="outline" 
                                className="cursor-pointer"
                                onClick={() => setAiProductName(suggestion)}
                            >
                                {suggestion}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
        <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Main Details Card */}
            <Card>
                <CardHeader>
                <CardTitle>Thông tin chi tiết sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên sản phẩm</FormLabel>
                                <FormControl>
                                <Input placeholder="Ví dụ: Microsoft Office 365" {...field} />
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
                                <Input placeholder="vi-du-microsoft-office-365" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="shortDescription"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả ngắn</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Một mô tả ngắn gọn, hấp dẫn về sản phẩm."
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="longDescription"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả chi tiết</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Mô tả đầy đủ các tính năng và lợi ích của sản phẩm."
                                rows={5}
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Phân loại & Định danh</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Danh mục</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn một danh mục" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.slug}>
                                    {category.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Thương hiệu</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn một thương hiệu" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.name}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="licenseType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Loại giấy phép</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại giấy phép" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Subscription">Theo tháng/năm (Subscription)</SelectItem>
                                    <SelectItem value="Perpetual">Vĩnh viễn (Perpetual)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="mfr"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mã nhà sản xuất (MFR)</FormLabel>
                            <FormControl>
                                <Input placeholder="MSFT-54321" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Variants Card */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Biến thể sản phẩm</CardTitle>
                    <CardDescription>Quản lý các phiên bản khác nhau của sản phẩm, ví dụ theo số lượng thiết bị hoặc thời hạn.</CardDescription>
                  </div>
                   <Button type="button" variant="outline" size="sm" onClick={handleGenerateVariants} disabled={isGenerating}>
                        {isGeneratingVariants ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Tạo bằng AI
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md bg-secondary/50 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Biến thể {index + 1}</h4>
                                {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                )}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <FormField
                                    control={form.control}
                                    name={`variants.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên biến thể</FormLabel>
                                            <FormControl><Input placeholder="1 năm / 1 PC" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.sku`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl><Input placeholder="SGS-MS-365-1Y1PC" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá (VND)</FormLabel>
                                            <FormControl><Input type="number" placeholder="1799000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`variants.${index}.resellerPrice`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá Reseller (VND)</FormLabel>
                                            <FormControl><Input type="number" placeholder="1500000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`variants.${index}.salePrice`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá sale (VND)</FormLabel>
                                            <FormControl><Input type="number" placeholder="1650000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <FormField
                                    control={form.control}
                                    name={`variants.${index}.saleStartDate`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Ngày bắt đầu Sale</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar locale={vi} mode="single" captionLayout="dropdown-buttons" fromYear={new Date().getFullYear() - 1} toYear={new Date().getFullYear() + 1} selected={field.value as Date | undefined} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.saleEndDate`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Ngày kết thúc Sale</FormLabel>
                                             <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar locale={vi} mode="single" captionLayout="dropdown-buttons" fromYear={new Date().getFullYear() - 1} toYear={new Date().getFullYear() + 10} selected={field.value as Date | undefined} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ id: nanoid(8), name: '', price: 0, salePrice: '', resellerPrice: '', sku: '', attributes: [] })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm biến thể
                    </Button>
                </CardContent>
            </Card>

            
            {/* Image Card */}
             <Card>
                <CardHeader>
                    <CardTitle>Hình ảnh</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                     <FormField
                        control={form.control}
                        name="imageHint"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Gợi ý AI cho hình ảnh (Prompt)</FormLabel>
                            <FormDescription>Nhập các từ khóa bằng tiếng Anh để AI tìm hình ảnh đại diện phù hợp.</FormDescription>
                            <FormControl>
                                <Input placeholder="Ví dụ: software product box, photo editing, minimal" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hình ảnh chính</FormLabel>
                                <FormControl>
                                    <FileUploader 
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        folder="product_images"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

             {/* Screenshots Card */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Ảnh chụp màn hình (Screenshots)</CardTitle>
                        <CardDescription>Cung cấp tối đa 5 URL hoặc tạo bằng AI.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={handleGenerateScreenshots} disabled={isGenerating}>
                         {isGeneratingScreenshots ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Tạo bằng AI
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(5)].map((_, index) => (
                        <FormField
                            key={index}
                            control={form.control}
                            name={`screenshots.${index}` as any}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL Ảnh chụp màn hình {index + 1}</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder="https://example.com/screenshot.jpg" {...field} value={field.value || ''} />
                                        </FormControl>
                                         <Button type="button" variant="outline" size="icon" onClick={() => setPreviewImageUrl(field.value)} disabled={!field.value}>
                                            <Eye className="h-4 w-4" />
                                         </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </CardContent>
            </Card>

             {/* SEO Card */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Cài đặt SEO</CardTitle>
                        <CardDescription>Tùy chỉnh tiêu đề và mô tả cho công cụ tìm kiếm. Nếu để trống, sẽ sử dụng tên và mô tả ngắn của sản phẩm.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={handleGenerateSeo} disabled={isGenerating}>
                        {isGeneratingSeo ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Tạo bằng AI
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tiêu đề SEO</FormLabel>
                            <FormControl>
                                <Input placeholder="Tiêu đề hiển thị trên Google" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mô tả SEO</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Mô tả ngắn gọn (khoảng 160 ký tự) cho sản phẩm này." {...field} value={field.value || ''} />
                            </FormControl>
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
                <Button type="submit" disabled={isLoading || isGenerating}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {action}
                </Button>
            </div>
        </form>
      </Form>
    </div>
    </>
  );
}
