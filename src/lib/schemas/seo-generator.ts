
import { z } from 'zod';

// Define a schema that accepts either product info or page info
export const SeoGeneratorInputSchema = z.object({
  productName: z.string().optional().describe('The name of the product.'),
  productDescription: z.string().optional().describe('A short description of the product.'),
  pageTitle: z.string().optional().describe('The title of the static page.'),
  pageContent: z.string().optional().describe('The content of the static page.'),
})
.refine(data => (data.productName && data.productDescription) || (data.pageTitle && data.pageContent), {
    message: "Either product information or page information must be provided.",
});
export type SeoGeneratorInput = z.infer<typeof SeoGeneratorInputSchema>;


export const SeoGeneratorOutputSchema = z.object({
  seoTitle: z.string().describe('The generated, SEO-optimized title (50-60 characters).'),
  seoDescription: z.string().describe('The generated, SEO-optimized meta description (150-160 characters).'),
});
export type SeoGeneratorOutput = z.infer<typeof SeoGeneratorOutputSchema>;
