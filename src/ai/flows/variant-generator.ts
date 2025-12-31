
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
        prompt: `B\u1EA1n l\u00E0 m\u1ED9t tr\u1EE3 l\u00FD chuy\u00EAn t\u1EA1o c\u00E1c bi\u1EBFn th\u1EC3 s\u1EA3n ph\u1EA9m cho m\u1ED9t c\u1EEDa h\u00E0ng ph\u1EA7n m\u1EC1m t\u1EA1i Vi\u1EC7t Nam.
**T\u00EAn s\u1EA3n ph\u1EA9m:** "${productName}"
**Th\u01B0\u01A1ng hi\u1EC7u:** "${brand}"
**Lo\u1EA1i gi\u1EA5y ph\u00E9p:** "${licenseType}"

**Y\u00EAu c\u1EA7u:**
- D\u1EF1a tr\u00EAn th\u00F4ng tin \u0111\u01B0\u1EE3c cung c\u1EA5p, h\u00E3y t\u1EA1o ra 3-5 bi\u1EBFn th\u1EC3 s\u1EA3n ph\u1EA9m kh\u00E1c nhau.
- N\u1EBFu lo\u1EA1i gi\u1EA5y ph\u00E9p l\u00E0 "Subscription" (Theo th\u00E1ng/n\u0103m), h\u00E3y t\u1EA1o c\u00E1c bi\u1EBFn th\u1EC3 d\u1EF1a tr\u00EAn **th\u1EDDi h\u1EA1n gi\u1EA5y ph\u00E9p** v\u00E0 **s\u1ED1 l\u01B0\u1EE3ng thi\u1EBFt b\u1ECB**. V\u00ED d\u1EE5: "1 n\u0103m / 1 PC", "2 n\u0103m / 3 thi\u1EBFt b\u1ECB}".
- N\u1EBFu lo\u1EA1i gi\u1EA5y ph\u00E9p l\u00E0 "Perpetual" (V\u0129nh vi\u1EC5n), h\u00E3y ch\u1EC9 t\u1EA1o c\u00E1c bi\u1EBFn th\u1EC3 d\u1EF1a tr\u00EAn **s\u1ED1 l\u01B0\u1EE3ng ng\u01B0\u1EDDi d\u00F9ng/thi\u1EBFt b\u1ECB**. V\u00ED d\u1EE5: "1 Ng\u01B0\u1EDDi d\u00F9ng", "5 Ng\u01B0\u1EDDi d\u00F9ng", "10 Thi\u1EBFt b\u1ECB}". Kh\u00F4ng t\u1EA1o bi\u1EBFn th\u1EC3 theo c\u1EA5p \u0111\u1ED9 t\u00EDnh n\u0103ng nh\u01B0 "C\u01A1 b\u1EA3n" hay "Chuy\u00EAn nghi\u1EC7p".

\u0110\u1ED1i v\u1EDBi m\u1ED7i bi\u1EBFn th\u1EC3, h\u00E3y t\u1EA1o:
1.  **id**: M\u1ED9t id duy nh\u1EA5t \u0111\u01B0\u1EE3c t\u1EA1o ng\u1EABu nhi\u00EAn cho m\u1ED7i bi\u1EBFn th\u1EC3.
2.  **name**: M\u1ED9t t\u00EAn m\u00F4 t\u1EA3 r\u00F5 r\u00E0ng b\u1EB1ng ti\u1EBFng Vi\u1EC7t (v\u00ED d\u1EE5: "1 n\u0103m / 1 PC").
3.  **price**: M\u1ED9t m\u1EE9c gi\u00E1 h\u1EE3p l\u00FD b\u1EB1ng Vi\u1EC7t Nam \u0110\u1ED3ng (VND). Gi\u00E1 ph\u1EA3i ph\u1EA3n \u00E1nh gi\u00E1 tr\u1ECB c\u1EE7a bi\u1EBFn th\u1EC3 (v\u00ED d\u1EE5: gi\u1EA5y ph\u00E9p d\u00E0i h\u01A1n ho\u1EB7c nhi\u1EC1u thi\u1EBFt b\u1ECB h\u01A1n th\u00EC \u0111\u1EAFt h\u01A1n).
4.  **salePrice**: M\u1ED9t m\u1EE9c gi\u00E1 b\u00E1n khuy\u1EBFn m\u00E3i t\u00F9y ch\u1ECDn, th\u1EA5p h\u01A1n gi\u00E1 g\u1ED1c.
5.  **sku**: M\u1ED9t m\u00E3 SKU duy nh\u1EA5t cho c\u1EEDa h\u00E0ng theo \u0111\u1ECBnh d\u1EA1ng "SGS-[THUONGHIEU]-[TENSP]-[CHITIETBIENTHE]". V\u00ED d\u1EE5: SGS-KASP-IS-1Y1PC.`,
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
