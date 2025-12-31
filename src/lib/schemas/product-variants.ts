import { z } from 'zod';

export const VariantGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the software product.'),
  licenseType: z.enum(['Subscription', 'Perpetual']).describe('The license type of the product.'),
  brand: z.string().describe('The brand of the product.'),
});
export type VariantGeneratorInput = z.infer<typeof VariantGeneratorInputSchema>;


const VariantSchema = z.object({
    id: z.string(),
    name: z.string().describe("The descriptive name for the variant (e.g., '1 năm / 1 PC', 'Vĩnh viễn')."),
    price: z.coerce.number().min(0).describe('The price for this variant in Vietnamese Dong (VND).'),
    salePrice: z.coerce.number().min(0).optional().describe('An optional sale price for this variant in VND.'),
    sku: z.string().min(1).describe('The generated Stock Keeping Unit (SKU) for this variant (e.g., "SGS-BRAND-PROD-1Y1PC").'),
    attributes: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

export const VariantGeneratorOutputSchema = z.object({
  variants: z.array(VariantSchema).min(1).describe('A list of 2-4 generated product variants.'),
});
export type VariantGeneratorOutput = z.infer<typeof VariantGeneratorOutputSchema>;
