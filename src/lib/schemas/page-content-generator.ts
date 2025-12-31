import { z } from 'zod';

export const PageContentGeneratorInputSchema = z.object({
  topic: z.string().describe('The topic or title of the page to generate content for.'),
});
export type PageContentGeneratorInput = z.infer<typeof PageContentGeneratorInputSchema>;

export const PageContentGeneratorOutputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content for the page body.'),
});
export type PageContentGeneratorOutput = z.infer<typeof PageContentGeneratorOutputSchema>;
