

'use client';

import { useEffect, useState, useMemo } from 'react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Search, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


function simpleMarkdownToHtml(markdown: string): string {
    if (!markdown) return '';

    return markdown
        // Handle headings: #, ##, ###
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Handle bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
        // Handle italic: *text* or _text_
        .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
        // Handle links: [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
        // Handle unordered lists: * or -
        .replace(/^\s*[\-\*] (.*)/gm, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\n<ul>/g, '') // Join consecutive lists
        // Handle ordered lists: 1.
        .replace(/^\s*\d+\. (.*)/gm, '<ol><li>$1</li></ol>')
        .replace(/<\/ol>\n<ol>/g, '') // Join consecutive lists
        // Handle line breaks within paragraphs, but separate paragraphs
        .split(/\n\s*\n/) // Split by blank lines
        .map(paragraph => {
            if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<ol')) {
                return paragraph;
            }
            return `<p>${paragraph.replace(/\n/g, '<br />')}</p>`;
        })
        .join('');
}


function GuideViewer({ guideContent, productName }: { guideContent: string | null | undefined, productName: string }) {
  return (
    <AlertDialogContent className="max-w-3xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Hướng dẫn sử dụng: {productName}</AlertDialogTitle>
        <AlertDialogDescription>
          {guideContent 
            ? "Thông tin chi tiết về cài đặt và sử dụng sản phẩm."
            : "Tài liệu cho sản phẩm này đang được cập nhật."
          }
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
        {guideContent ? (
            <div
                className="prose prose-sm max-w-none [&_a]:text-primary [&_p]:mb-4"
                dangerouslySetInnerHTML={{
                    __html: simpleMarkdownToHtml(guideContent),
                }}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Tài liệu đang được cập nhật. Vui lòng quay lại sau.</p>
            </div>
        )}
      </ScrollArea>
      <AlertDialogFooter>
        <AlertDialogCancel>Đóng</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}


function DocumentsPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                 <div className="flex items-center py-4">
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="border rounded-md">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

const faqs = [
    {
        question: "Sản phẩm bán trên Saigonsoft.com có phải là hàng chính hãng không?",
        answer: "Chắc chắn. Chúng tôi cam kết 100% sản phẩm được cung cấp đều là phần mềm bản quyền chính hãng, được cấp phép từ các nhà phân phối chính thức. Mọi sản phẩm đều đi kèm đầy đủ tính năng và nhận được sự hỗ trợ từ nhà sản xuất."
    },
    {
        question: "Làm thế nào để tôi nhận được sản phẩm sau khi thanh toán?",
        answer: "Sau khi bạn thanh toán thành công và đơn hàng được xử lý, bạn sẽ nhận được email chứa license key và liên kết tải về phần mềm. Bạn cũng có thể truy cập vào mục 'Tải về & Giấy phép' trong tài khoản của mình để xem lại thông tin này bất cứ lúc nào."
    },
    {
        question: "Tôi có được hỗ trợ cài đặt không?",
        answer: "Tất cả sản phẩm đều có tài liệu hướng dẫn cài đặt chi tiết mà bạn có thể tìm thấy trên trang này. Nếu bạn gặp khó khăn, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ. Vui lòng liên hệ qua các kênh được cung cấp tại trang Giới thiệu."
    },
     {
        question: "License key là gì và tại sao tôi cần nó?",
        answer: "License key (hoặc mã kích hoạt) là một chuỗi ký tự xác nhận rằng bạn đã mua bản quyền sử dụng phần mềm. Bạn cần nhập mã này trong quá trình cài đặt hoặc lần đầu sử dụng để kích hoạt đầy đủ các tính năng của sản phẩm."
    },
    {
        question: "Sự khác biệt giữa giấy phép vĩnh viễn (Perpetual) và theo tháng/năm (Subscription) là gì?",
        answer: "Giấy phép vĩnh viễn cho phép bạn sử dụng phiên bản phần mềm bạn đã mua mãi mãi, nhưng có thể không bao gồm các bản cập nhật lớn trong tương lai. Giấy phép theo tháng/năm yêu cầu bạn trả phí định kỳ để tiếp tục sử dụng, nhưng thường bao gồm tất cả các bản cập nhật và tính năng mới nhất trong suốt thời gian đăng ký."
    }
];


export default function DocumentsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedBrand, setSelectedBrand] = useState('all');

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      const allProducts = await getProducts();
      setProducts(allProducts);
      setIsLoading(false);
    }
    fetchProducts();
  }, []);

  const brands = useMemo(() => {
    const allBrands = products.map(p => p.brand);
    return [...new Set(allBrands)].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let tempProducts = products;

    if (selectedBrand !== 'all') {
        tempProducts = tempProducts.filter(p => p.brand === selectedBrand);
    }
    
    if (debouncedSearchTerm) {
      tempProducts = tempProducts.filter((product) =>
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    return tempProducts;

  }, [products, debouncedSearchTerm, selectedBrand]);

  if (isLoading) {
      return <DocumentsPageSkeleton />
  }


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Tài liệu hướng dẫn</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tìm kiếm và xem hướng dẫn chi tiết cho tất cả các phần mềm của chúng tôi.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài liệu</CardTitle>
          <CardDescription>
            Duyệt qua danh sách hoặc sử dụng các bộ lọc để tìm tài liệu bạn cần.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 py-4">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên sản phẩm..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full pl-10"
                    />
                </div>
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                     <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                        <SelectTrigger>
                            <SelectValue placeholder="Lọc theo thương hiệu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                            {brands.map(brand => (
                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="hidden sm:table-cell">Thương hiệu</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                         <AlertDialog key={product.id}>
                            <TableRow>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="hidden sm:table-cell">{product.brand}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={!product.guide}>
                                            <Info className="mr-2 h-4 w-4" />
                                            Xem hướng dẫn
                                        </Button>
                                    </AlertDialogTrigger>
                                </TableCell>
                            </TableRow>
                            <GuideViewer guideContent={product.guide} productName={product.name} />
                        </AlertDialog>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            Không tìm thấy tài liệu nào.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <header>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Câu hỏi thường gặp (FAQs)</h2>
            <p className="mt-2 text-lg text-muted-foreground">
                Giải đáp các thắc mắc phổ biến về sản phẩm và dịch vụ của chúng tôi.
            </p>
        </header>
        <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                 <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                       {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </section>
    </div>
  );
}
