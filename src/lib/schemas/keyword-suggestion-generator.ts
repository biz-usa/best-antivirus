
import { z } from 'zod';

export const KeywordSuggestionInputSchema = z.object({
  productNames: z.array(z.string()).describe('A list of product names.'),
});
export type KeywordSuggestionInput = z.infer<typeof KeywordSuggestionInputSchema>;


export const KeywordSuggestionOutputSchema = z.object({
  keywords: z.array(z.string()).length(6).describe('An array of exactly 6 suggested search keywords.'),
});
export type KeywordSuggestionOutput = z.infer<typeof KeywordSuggestionOutputSchema>;
