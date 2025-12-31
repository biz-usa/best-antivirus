
'use server';

import { z } from 'zod';
import { ai, getModelByName } from '@/ai/genkit';
import { ProductComparisonInputSchema, ProductComparisonOutputSchema, type ProductComparisonInput, type ProductComparisonOutput } from '@/lib/schemas/product-comparison';


const productComparisonGeneratorFlow = ai.defineFlow(
  {
    name: 'productComparisonGeneratorFlow',
    inputSchema: ProductComparisonInputSchema,
    outputSchema: ProductComparisonOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
        name: 'productComparisonPrompt',
        model: getModelByName(),
        input: { schema: ProductComparisonInputSchema },
        output: { schema: ProductComparisonOutputSchema },
        prompt: `Bạn là một chuyên gia tư vấn sản phẩm cho một cửa hàng phần mềm tại Việt Nam.
Nhiệm vụ của bạn là tạo một bảng so sánh chi tiết giữa các sản phẩm sau:

Sản phẩm chính:
- Tên: {{productName}}
- Thương hiệu: {{productBrand}}
- Giá: {{productPrice}}
- Mô tả: {{productShortDescription}}

Đối thủ:
{{#each competitors}}
- Tên: {{this.name}}
- Thương hiệu: {{this.brand}}
- Giá: {{this.price}}
- Mô tả: {{this.shortDescription}}
{{/each}}

**Yêu cầu:**
1.  **Xác định các sản phẩm:** Trả về thông tin cơ bản (tên, thương hiệu, giá) cho sản phẩm chính và từng đối thủ.
2.  **Tạo Bảng So sánh (comparison):**
    *   Xác định 4-5 tiêu chí so sánh quan trọng nhất (VD: Tính năng chính, Hiệu suất, Dễ sử dụng, Hỗ trợ, Giá cả).
    *   Đối với mỗi tiêu chí, viết một mô tả ngắn gọn và khách quan cho từng sản phẩm.
    *   Đảm bảo rằng mảng 'competitorValues' có cùng số lượng phần tử với danh sách đối thủ được cung cấp.
3.  **Toàn bộ nội dung** phải được viết bằng **tiếng Việt**.`,
    });
    
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate comparison.");
    }
    return output;
  }
);


export async function generateProductComparison(input: ProductComparisonInput): Promise<ProductComparisonOutput> {
  return productComparisonGeneratorFlow(input);
}
