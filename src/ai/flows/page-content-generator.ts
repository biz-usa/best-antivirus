
'use server';

import { ai, getModelByName } from '@/ai/genkit';
import { z } from 'zod';
import { PageContentGeneratorInputSchema, PageContentGeneratorOutputSchema, type PageContentGeneratorInput, type PageContentGeneratorOutput } from '@/lib/schemas/page-content-generator';


const pageContentGeneratorFlow = ai.defineFlow(
  {
    name: 'pageContentGeneratorFlow',
    inputSchema: PageContentGeneratorInputSchema,
    outputSchema: PageContentGeneratorOutputSchema,
  },
  async ({ topic }) => {
    const pageContentGeneratorPrompt = ai.definePrompt({
        name: 'pageContentGeneratorPrompt',
        model: getModelByName(),
        input: { schema: z.object({ topic: z.string() }) },
        output: { schema: PageContentGeneratorOutputSchema },
        prompt: `Bạn là một người viết nội dung chuyên nghiệp cho một trang web thương mại điện tử Việt Nam.
Chủ đề của trang là: "{{topic}}".

Hãy tạo nội dung chi tiết cho trang này. Nội dung cần đầy đủ thông tin, hấp dẫn và được định dạng tốt bằng HTML.

**Yêu cầu:**
1.  **htmlContent**: Viết nội dung chi tiết (khoảng 200-400 từ) bằng tiếng Việt. Sử dụng các thẻ HTML cơ bản như <h2>, <h3>, <p>, <ul>, <li>, <strong>, và <a> để cấu trúc nội dung một cách rõ ràng.
    - Bao gồm ít nhất một tiêu đề phụ (<h2>).
    - Nếu phù hợp, hãy bao gồm một danh sách (<ul>).
    - In đậm (<strong>) các điểm quan trọng.
    - Không bao gồm thẻ <html>, <head>, hoặc <body>. Chỉ trả về nội dung cho phần body.`,
    });

    const { output } = await pageContentGeneratorPrompt({ topic });
      if (!output) {
      throw new Error('AI failed to generate page content.');
    }
    return output;
  }
);


export async function generatePageContent(input: PageContentGeneratorInput): Promise<PageContentGeneratorOutput> {
  return pageContentGeneratorFlow(input);
}
