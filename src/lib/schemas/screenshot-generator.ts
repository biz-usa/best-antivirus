
import { z } from 'zod';

export const ScreenshotGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the software product.'),
  productDescription: z.string().describe('A brief description of the software product.'),
});
export type ScreenshotGeneratorInput = z.infer<typeof ScreenshotGeneratorInputSchema>;


export const ScreenshotGeneratorOutputSchema = z.object({
  screenshotUrls: z.array(z.string().url()).length(5).describe('An array of exactly 5 generated screenshot URLs.'),
});
export type ScreenshotGeneratorOutput = z.infer<typeof ScreenshotGeneratorOutputSchema>;
