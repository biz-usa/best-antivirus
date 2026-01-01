
'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';

import { Toggle } from '@/components/ui/toggle';
import {
  Bold, Italic, Strikethrough, Heading2, List, ListOrdered, UploadCloud, Link as LinkIcon, Youtube as YoutubeIcon, CodeXml, Pilcrow, AlignLeft, AlignCenter, AlignRight, Highlighter, Palette, Table as TableIcon, Trash2, Heading3, Heading4, Heading5, Heading6, RemoveFormatting
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/storage';
import DOMPurify from 'dompurify';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface RichTextEditorProps {
    content: string;
    onChange: (richText: string) => void;
}

const TableToolbar = ({ editor }: { editor: Editor }) => {
    const e = editor as any;
    return (
    <>
        <Separator orientation="vertical" className="h-6" />
        <Popover>
            <PopoverTrigger asChild>
                <Toggle type="button" size="sm"><TableIcon className="h-4 w-4" /></Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-4 gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert Table</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().addColumnBefore().run()} disabled={!e.can().addColumnBefore()}>Add Column Before</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().addColumnAfter().run()} disabled={!e.can().addColumnAfter()}>Add Column After</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().deleteColumn().run()} disabled={!e.can().deleteColumn()}>Delete Column</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().addRowBefore().run()} disabled={!e.can().addRowBefore()}>Add Row Before</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().addRowAfter().run()} disabled={!e.can().addRowAfter()}>Add Row After</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().deleteRow().run()} disabled={!e.can().deleteRow()}>Delete Row</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().deleteTable().run()} disabled={!e.can().deleteTable()}>Delete Table</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().mergeCells().run()} disabled={!e.can().mergeCells()}>Merge Cells</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().splitCell().run()} disabled={!e.can().splitCell()}>Split Cell</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().toggleHeaderColumn().run()} disabled={!e.can().toggleHeaderColumn()}>Toggle Header Column</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => e.chain().focus().toggleHeaderRow().run()} disabled={!e.can().toggleHeaderRow()}>Toggle Header Row</Button>
                </div>
            </PopoverContent>
        </Popover>
    </>
    );
};


const LinkEditor = ({ editor }: { editor: Editor }) => {
    const [url, setUrl] = useState(editor.getAttributes('link').href || '');

    const handleSetLink = useCallback(() => {
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
        } else {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        }
    }, [editor, url]);

    return (
        <PopoverContent className="w-80 p-2">
            <div className="flex items-center gap-2">
                <Input
                    type="url"
                    placeholder="Dán hoặc nhập URL..."
                    className="h-8"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSetLink();
                        }
                    }}
                />
                <Button size="sm" className="h-8" onClick={handleSetLink} type="button">
                    Áp dụng
                </Button>
            </div>
        </PopoverContent>
    );
};


const EditorToolbar = ({ editor, viewMode, onToggleViewMode }: { editor: Editor | null, viewMode: 'rich' | 'html', onToggleViewMode: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const e = editor as any;

    const addImage = useCallback(async (file: File) => {
        if (!e || !file) return;
        if (file.size / 1024 / 1024 > 5) {
             toast({ variant: 'destructive', title: 'File quá lớn', description: 'Vui lòng chọn ảnh có dung lượng dưới 5MB.' });
            return;
        }

        try {
            const uploadPath = `page-content/${Date.now()}-${file.name}`;
            const url = await uploadFile(file, uploadPath);
            e.chain().focus().setImage({ src: url }).run();
        } catch (error) {
            console.error('Image upload failed', error);
            toast({ variant: 'destructive', title: 'Tải ảnh thất bại', description: 'Đã có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.' });
        }
    }, [e, toast]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) addImage(file);
        event.target.value = '';
    }, [addImage]);

    const addYoutubeVideo = useCallback(() => {
        const url = prompt('Nhập URL video YouTube:');
        if (url && e) {
            e.commands.setYoutubeVideo({
                src: url,
            });
        }
    }, [e]);
    
    
    useEffect(() => {
        if (fileInputRef.current) {
            fileInputRef.current.addEventListener('change', handleFileChange as any);
        }
        return () => {
            if (fileInputRef.current) {
                fileInputRef.current.removeEventListener('change', handleFileChange as any);
            }
        };
    }, [handleFileChange]);

    if (!editor) return null;

    return (
        <div className="border border-input rounded-md p-1 flex flex-wrap items-center gap-1">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" />
             
            <Toggle type="button" size="sm" pressed={editor.isActive('bold')} onPressedChange={() => e.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive('italic')} onPressedChange={() => e.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive('strike')} onPressedChange={() => e.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive('highlight')} onPressedChange={() => e.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></Toggle>

            <Popover>
                <PopoverTrigger asChild>
                    <Toggle type="button" size="sm" pressed={!!editor.getAttributes('textStyle').color}><Palette className="h-4 w-4" /></Toggle>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <input type="color" className="w-12 h-10 border-0 cursor-pointer" onInput={(ev) => e.chain().focus().setColor((ev.target as HTMLInputElement).value).run()} value={editor.getAttributes('textStyle').color || '#000000'} />
                </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6" />

            <Toggle type="button" size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => e.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => e.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive('heading', { level: 4 })} onPressedChange={() => e.chain().focus().toggleHeading({ level: 4 }).run()}><Heading4 className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-6" />

            <Toggle type="button" size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => e.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => e.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => e.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Toggle>
            
            <Separator orientation="vertical" className="h-6" />

            <Toggle type="button" size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => e.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => e.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-6" />
            
             <Popover>
                <PopoverTrigger asChild>
                    <Toggle type="button" size="sm" pressed={editor.isActive('link')}>
                        <LinkIcon className="h-4 w-4" />
                    </Toggle>
                </PopoverTrigger>
                <LinkEditor editor={editor} />
            </Popover>

            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="p-2 h-auto"><UploadCloud className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={addYoutubeVideo} className="p-2 h-auto"><YoutubeIcon className="h-4 w-4" /></Button>
            
            <TableToolbar editor={editor} />
            
            <Separator orientation="vertical" className="h-6" />

            <Toggle type="button" size="sm" onClick={() => e.chain().focus().unsetAllMarks().run()}><RemoveFormatting className="h-4 w-4" /></Toggle>
            <Toggle type="button" size="sm" pressed={viewMode === 'html'} onPressedChange={onToggleViewMode}><CodeXml className="h-4 w-4" /></Toggle>
        </div>
    );
};

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const [viewMode, setViewMode] = useState<'rich' | 'html'>('rich');
    const [htmlContent, setHtmlContent] = useState(content);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                 heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Image.configure({ inline: false, allowBase64: false }),
            Link.configure({ 
                openOnClick: false, 
                autolink: true, 
                linkOnPaste: true, 
                HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } 
            }),
            Youtube.configure({
                controls: true,
                modestBranding: true,
                HTMLAttributes: {
                    class: 'w-full aspect-video',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ] as any, // Cast extensions array to any to avoid type mismatch hell
        content: content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[300px]',
            },
        },
        onUpdate: ({ editor }) => {
            const dirtyHtml = editor.getHTML();
            // Cast DOMPurify to any to avoid type issues with sanitize method
            const cleanHtml = (DOMPurify as any).sanitize(dirtyHtml, {
                ADD_TAGS: ['iframe', 'figure', 'figcaption'],
                ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height', 'class', 'style', 'data-youtube-video', 'alt', 'title', 'target', 'rel'],
            });
            onChange(cleanHtml);
            setHtmlContent(cleanHtml);
        },
    });
    
     useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, false); 
        }
    }, [content, editor]);

    const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newHtml = e.target.value;
        setHtmlContent(newHtml);
        if (editor) {
             if (editor.getHTML() !== newHtml) {
                 editor.commands.setContent(newHtml, false);
            }
        }
    };
    
    const handleHtmlBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    }

    const toggleViewMode = () => {
        if (viewMode === 'rich' && editor) {
            // Update htmlContent with the latest from the editor before switching
            setHtmlContent(editor.getHTML());
        }
        setViewMode(current => current === 'rich' ? 'html' : 'rich');
    };
    
    return (
        <div className="flex flex-col gap-2">
            <EditorToolbar editor={editor} viewMode={viewMode} onToggleViewMode={toggleViewMode} />
            {viewMode === 'rich' ? (
                <EditorContent editor={editor} />
            ) : (
                <Textarea
                    value={htmlContent}
                    onChange={handleHtmlChange}
                    onBlur={handleHtmlBlur}
                    className="min-h-[300px] font-mono text-xs"
                    placeholder="<p>Nhập mã HTML của bạn ở đây...</p>"
                />
            )}
        </div>
    );
}
