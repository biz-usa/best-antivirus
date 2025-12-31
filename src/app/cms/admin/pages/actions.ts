
'use server';

import { z } from 'zod';
// Use Admin SDK
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { generatePageContent as generatePageContentFlow } from '@/ai/flows/page-content-generator';
import type { PageContentGeneratorInput, PageContentGeneratorOutput } from '@/lib/schemas/page-content-generator';
import { editPageContent as editPageContentFlow } from '@/ai/flows/page-content-editor';
import type { PageContentEditorInput, PageContentEditorOutput } from '@/lib/schemas/page-content-editor';
import { generateSeoContent } from '@/ai/flows/seo-generator';
import type { SeoGeneratorInput, SeoGeneratorOutput } from '@/lib/schemas/seo-generator';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);


const pageContentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc.'),
  slug: z.string().min(1, 'Slug là bắt buộc.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang."),
  content: z.string().min(1, 'Nội dung là bắt buộc.'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const newPageSchema = pageContentSchema;


export async function createPage(data: z.infer<typeof newPageSchema>) {
    const validatedData = newPageSchema.parse(data);
    const { slug, title, content, seoTitle, seoDescription } = validatedData;
    const pageRef = db.collection('pages').doc(slug);

    const docSnap = await pageRef.get();
    if (docSnap.exists) {
        throw new Error(`Trang với slug "${slug}" đã tồn tại.`);
    }

    try {
        await pageRef.set({
            title,
            content,
            seoTitle: seoTitle || '',
            seoDescription: seoDescription || '',
            updatedAt: FieldValue.serverTimestamp(),
        });
        revalidatePath('/cms/admin/pages');
        revalidatePath(`/pages/${slug}`);
    } catch (error) {
        console.error("Error creating new page:", error);
        throw new Error('Không thể tạo trang mới.');
    }
}


export async function updatePageContent(oldSlug: string, data: z.infer<typeof pageContentSchema>): Promise<{ newSlug: string }> {
  const validatedData = pageContentSchema.parse(data);
  
  const oldPageRef = db.collection('pages').doc(oldSlug);
  const newPageRef = db.collection('pages').doc(validatedData.slug);

  const dataToSave = {
    title: validatedData.title,
    content: validatedData.content,
    seoTitle: validatedData.seoTitle || '',
    seoDescription: validatedData.seoDescription || '',
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
      if (oldSlug !== validatedData.slug) {
          const oldSnap = await oldPageRef.get();
          if (!oldSnap.exists) throw new Error("Trang cũ không tồn tại.");
          
          const newSnap = await newPageRef.get();
          if (newSnap.exists) throw new Error(`Slug mới "${validatedData.slug}" đã tồn tại.`);

          await newPageRef.set(oldSnap.data()!);
          await newPageRef.update(dataToSave);
          await oldPageRef.delete();
      } else {
          await oldPageRef.update(dataToSave);
      }

      revalidatePath(`/pages/${oldSlug}`);
      if (oldSlug !== validatedData.slug) {
        revalidatePath(`/pages/${validatedData.slug}`);
      }
      revalidatePath('/cms/admin/pages');
      revalidatePath(`/cms/admin/pages/${validatedData.slug}`);
      revalidatePath('/', 'layout');

      return { newSlug: validatedData.slug };

  } catch (error: any) {
    console.error(`Error updating page ${oldSlug}:`, error);
     if (error.message.includes("đã tồn tại")) {
        throw error;
    }
    throw new Error('Không thể cập nhật nội dung trang.');
  }
}

export async function deletePage(slug: string) {
    if (!slug) throw new Error("Cần có slug để xóa trang.");
    const pageRef = db.collection('pages').doc(slug);
    try {
        await pageRef.delete();
        revalidatePath('/cms/admin/pages');
        revalidatePath(`/pages/${slug}`);
    } catch (error) {
        console.error("Error deleting page:", error);
        throw new Error("Không thể xóa trang.");
    }
}


export async function generatePageContent(input: PageContentGeneratorInput): Promise<PageContentGeneratorOutput> {
    try {
        const result = await generatePageContentFlow(input);
        return result;
    } catch (error) {
        console.error("Error generating page content with AI:", error);
        throw new Error("Không thể tạo nội dung trang bằng AI.");
    }
}

export async function editPageContent(input: PageContentEditorInput): Promise<PageContentEditorOutput> {
    try {
        const result = await editPageContentFlow(input);
        return result;
    } catch (error) {
        console.error("Error editing page content with AI:", error);
        throw new Error("Không thể chỉnh sửa nội dung trang bằng AI.");
    }
}

export async function generatePageSeoContent(input: SeoGeneratorInput): Promise<SeoGeneratorOutput> {
    try {
        return await generateSeoContent(input);
    } catch (error) {
        console.error("Error generating SEO content:", error);
        throw new Error("Failed to generate SEO content using AI.");
    }
}
