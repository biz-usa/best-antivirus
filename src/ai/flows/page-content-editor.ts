
'use server';

import { z } from 'zod';
import { ai, getModelByName } from '@/ai/genkit';
import { PageContentEditorInputSchema, PageContentEditorOutputSchema, type PageContentEditorInput, type PageContentEditorOutput } from '@/lib/schemas/page-content-editor';


const pageContentEditorFlow = ai.defineFlow(
  {
    name: 'pageContentEditorFlow',
    inputSchema: PageContentEditorInputSchema,
    outputSchema: PageContentEditorOutputSchema,
  },
  async ({ existingContent, instruction }) => {
      const pageContentEditorPrompt = ai.definePrompt({
          name: 'pageContentEditorPrompt',
          model: getModelByName(),
          input: { schema: z.object({ existingContent: z.string(), instruction: z.string() }) },
          output: { schema: PageContentEditorOutputSchema },
          prompt: `Bạn là một biên tập viên web chuyên nghiệp. Nhiệm vụ của bạn là chỉnh sửa nội dung HTML hiện có dựa trên một hướng dẫn cụ thể.

**Nội dung HTML hiện tại:**
'''html
{{existingContent}}
'''

**Hướng dẫn chỉnh sửa:**
"{{instruction}}"

**Yêu cầu:**
- Đọc kỹ nội dung hiện tại và hướng dẫn.
- Áp dụng các thay đổi theo yêu cầu vào nội dung HTML.
- **Giữ nguyên cấu trúc và các thẻ HTML hiện có** trừ khi được yêu cầu thay đổi.
- Chỉ trả về nội dung đã được cập nhật trong trường 'newHtmlContent'.`,
      });

      const { output } = await pageContentEditorPrompt({ existingContent, instruction });
      if (!output) {
        throw new Error('AI failed to edit the content.');
      }
      return output;
  }
);


export async function editPageContent(input: PageContentEditorInput): Promise<PageContentEditorOutput> {
  return pageContentEditorFlow(input);
}
