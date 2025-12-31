

'use client';

import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, FileDown } from 'lucide-react';
import { useRef } from 'react';

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


export function GuideViewer({ guideContent, productName }: { guideContent: string, productName: string }) {
  const guideRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCopyContent = () => {
    if (guideContent) {
      navigator.clipboard.writeText(guideContent);
      toast({
        title: 'Đã sao chép!',
        description: 'Nội dung hướng dẫn đã được sao chép vào bộ nhớ tạm.',
      });
    }
  };

  const handleDownloadTxt = () => {
    if (!guideContent) return;
    const blob = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFilename = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeFilename}_huongdan.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <AlertDialogContent className="max-w-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Hướng dẫn sử dụng: {productName}</AlertDialogTitle>
        <AlertDialogDescription>
          Thông tin cài đặt và sử dụng sản phẩm.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ScrollArea className="h-96 w-full rounded-md border">
         <div ref={guideRef} className="prose max-w-none p-6 bg-white dark:bg-card text-card-foreground">
            <div
                dangerouslySetInnerHTML={{
                    __html: simpleMarkdownToHtml(guideContent),
                }}
            />
         </div>
      </ScrollArea>
      <AlertDialogFooter>
        <Button variant="outline" onClick={handleDownloadTxt}>
            <FileDown className="mr-2 h-4 w-4" />
            Tải về TXT
        </Button>
        <Button variant="outline" onClick={handleCopyContent}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Sao chép nội dung
        </Button>
        <AlertDialogCancel>Đóng</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
