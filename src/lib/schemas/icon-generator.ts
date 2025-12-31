
import { z } from 'zod';

export const generateIconSuggestionsSchema = z.object({
  names: z.array(z.string()).describe('A list of product category or brand names.'),
});
export type GenerateIconSuggestionsInput = z.infer<typeof generateIconSuggestionsSchema>;

export const generateIconSuggestionsOutputSchema = z.object({
  icons: z.array(z.object({
    name: z.string().describe('The original category/brand name.'),
    iconName: z.string().describe('The suggested Lucide-React icon name in PascalCase.'),
  })),
});
export type GenerateIconSuggestionsOutput = z.infer<typeof generateIconSuggestionsOutputSchema>;
