
'use server';

import { ai, getModelByName } from '@/ai/genkit';
import { KeywordSuggestionInputSchema, KeywordSuggestionOutputSchema, type KeywordSuggestionInput, type KeywordSuggestionOutput } from '@/lib/schemas/keyword-suggestion-generator';


const keywordSuggestionGeneratorFlow = ai.defineFlow(
  {
    name: 'keywordSuggestionGeneratorFlow',
    inputSchema: KeywordSuggestionInputSchema,
    outputSchema: KeywordSuggestionOutputSchema,
  },
  async ({ productNames }) => {
    const keywordSuggestionPrompt = ai.definePrompt({
        name: 'keywordSuggestionPrompt',
        model: getModelByName(),
        input: { schema: KeywordSuggestionInputSchema },
        output: { schema: KeywordSuggestionOutputSchema },
        prompt: `Bạn là một chuyên gia SEO cho một trang web thương mại điện tử Việt Nam.
Dựa trên danh sách tên sản phẩm sau đây, hãy đề xuất chính xác 6 từ khóa tìm kiếm phổ biến và có liên quan nhất mà người dùng có thể sử dụng.

**Danh sách sản phẩm:**
{{#each productNames}}
- {{{this}}}
{{/each}}

**Yêu cầu:**
- Tạo ra một danh sách gồm chính xác **6** từ khóa.
- Các từ khóa phải viết bằng **tiếng Việt**.
- Các từ khóa phải có liên quan trực tiếp đến các sản phẩm được liệt kê.
- Ví dụ: "phan mem diet virus", "mua key windows 11", "autocad 2025", "kaspersky cho windows".`
    });

    const { output } = await keywordSuggestionPrompt({ productNames });
    if (!output) {
      throw new Error("AI failed to generate keyword suggestions.");
    }
    return output;
  }
);


export async function generateKeywordSuggestions(input: KeywordSuggestionInput): Promise<KeywordSuggestionOutput> {
  return keywordSuggestionGeneratorFlow(input);
}
