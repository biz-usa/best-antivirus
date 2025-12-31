
'use server';

import { getAi, getModelByName } from '@/ai/genkit';
import { VariantGeneratorInputSchema, VariantGeneratorOutputSchema, type VariantGeneratorInput, type VariantGeneratorOutput } from '@/lib/schemas/product-variants';

const ai = getAi();

export async function generateVariants(input: VariantGeneratorInput): Promise<VariantGeneratorOutput> {
  const variantGeneratorFlow = ai.defineFlow(
    {
      name: 'variantGeneratorFlow',
      inputSchema: VariantGeneratorInputSchema,
      outputSchema: VariantGeneratorOutputSchema,
    },
    async ({ productName, licenseType, brand }) => {
      const prompt = ai.definePrompt({
        name: 'variantGeneratorPrompt',
        model: getModelByName(),
        input: { schema: VariantGeneratorInputSchema },
        output: { schema: VariantGeneratorOutputSchema },
        prompt: `Bạn là một trợ lý chuyên tạo các biến thể sản phẩm cho một cửa hàng phần mềm tại Việt Nam.
**Tên sản phẩm:** "${productName}"
**Thương hiệu:** "${brand}"
**Loại giấy phép:** "${licenseType}"

**Yêu cầu:**
- Dựa trên thông tin được cung cấp, hãy tạo ra 3-5 biến thể sản phẩm khác nhau.
- Nếu loại giấy phép là "Subscription" (Theo tháng/năm), hãy tạo các biến thể dựa trên **thời hạn giấy phép** và **số lượng thiết bị**. Ví dụ: "1 năm / 1 PC", "2 năm / 3 thiết bị}".
- Nếu loại giấy phép là "Perpetual" (Vĩnh viễn), hãy chỉ tạo các biến thể dựa trên **số lượng người dùng/thiết bị**. Ví dụ: "1 Người dùng", "5 Người dùng", "10 Thiết bị}". Không tạo biến thể theo cấp độ tính năng như "Cơ bản" hay "Chuyên nghiệp".

Đối với mỗi biến thể, hãy tạo:
1.  **id**: Một id duy nhất được tạo ngẫu nhiên cho mỗi biến thể.
2.  **name**: Một tên mô tả rõ ràng bằng tiếng Việt (ví dụ: "1 năm / 1 PC").
3.  **price**: Một mức giá hợp lý bằng Việt Nam Đồng (VND). Giá phải phản ánh giá trị của biến thể (ví dụ: giấy phép dài hơn hoặc nhiều thiết bị hơn thì đắt hơn).
4.  **salePrice**: Một mức giá bán khuyến mãi tùy chọn, thấp hơn giá gốc.
5.  **sku**: Một mã SKU duy nhất cho cửa hàng theo định dạng "SGS-[THUONGHIEU]-[TENSP]-[CHITIETBIENTHE]". Ví dụ: SGS-KASP-IS-1Y1PC.`,
      });

      const { output } = await prompt({ productName, licenseType, brand });
      if (!output) {
        throw new Error("AI failed to generate variants.");
      }
      return output;
    }
  );

  return variantGeneratorFlow(input);
}
