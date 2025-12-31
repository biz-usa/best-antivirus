import { z } from 'zod';

export const GuideGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the software product.'),
  productDescription: z.string().describe('A brief description of the product.'),
});
export type GuideGeneratorInput = z.infer<typeof GuideGeneratorInputSchema>;

// The output is now a single markdown string, which is more reliable.
export const GuideGeneratorOutputSchema = z.object({
  guide: z.string().describe('The full user guide content in Markdown format.'),
});
export type GuideGeneratorOutput = z.infer<typeof GuideGeneratorOutputSchema>;
