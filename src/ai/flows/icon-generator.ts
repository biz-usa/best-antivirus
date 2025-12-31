
'use server';

/**
 * @fileOverview A flow to generate icon suggestions for categories.
 */

import { getAi, getModelByName } from '@/ai/genkit';
import { generateIconSuggestionsSchema, generateIconSuggestionsOutputSchema, type GenerateIconSuggestionsInput, type GenerateIconSuggestionsOutput } from '@/lib/schemas/icon-generator';

const ai = getAi();

const generateIconSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateIconSuggestionsFlow',
    inputSchema: generateIconSuggestionsSchema,
    outputSchema: generateIconSuggestionsOutputSchema,
  },
  async ({ names }) => {
    const prompt = ai.definePrompt({
      name: 'iconSuggestionPrompt',
      model: getModelByName(),
      input: { schema: generateIconSuggestionsSchema },
      output: { schema: generateIconSuggestionsOutputSchema },
      prompt: `B\u1EA1n l\u00E0 m\u1ED9t nh\u00E0 thi\u1EBFt k\u1EBF giao di\u1EC7n ng\u01B0\u1EDDi d\u00F9ng. D\u1EF1a tr\u00EAn danh s\u00E1ch t\u00EAn sau \u0111\u00E2y, h\u00E3y \u0111\u1EC1 xu\u1EA5t m\u1ED9t t\u00EAn icon t\u01B0\u01A1ng \u1EE9ng t\u1EEB th\u01B0 vi\u1EC7n Lucide Icons.

**Danh s\u00E1ch t\u00EAn:**
{{#each names}}
- {{{.}}}
{{/each}}

**Y\u00EAu c\u1EA7u:**
- \u0110\u1ED1i v\u1EDBi m\u1ED7i t\u00EAn, h\u00E3y cung c\u1EA5p t\u00EAn icon ph\u00F9 h\u1EE3p nh\u1EA5t t\u1EEB th\u01B0 vi\u1EC7n Lucide Icons (https://lucide.dev/).
- Tr\u1EA3 v\u1EC1 t\u00EAn icon \u1EDF d\u1EA1ng PascalCase (v\u00ED d\u1EE5: "Cpu", "Laptop", "ShieldCheck").
- K\u1EBFt qu\u1EA3 ph\u1EA3i l\u00E0 m\u1ED9t m\u1EA3ng c\u00E1c \u0111\u1ED1i t\u01B0\u1EE3ng, m\u1ED7i \u0111\u1ED1i t\u01B0\u1EE3ng ch\u1EE9a 'name' (t\u00EAn g\u1ED1c) v\u00E0 'iconName' (t\u00EAn icon \u0111\u01B0\u1EE3c \u0111\u1EC1 xu\u1EA5t).
- S\u1ED1 l\u01B0\u1EE3ng icon trong k\u1EBFt qu\u1EA3 ph\u1EA3i kh\u1EDBp v\u1EDBi s\u1ED1 l\u01B0\u1EE3ng t\u00EAn \u0111\u00E3 cho.`,
    });
    
    const { output } = await prompt({ names });
    if (!output) {
      throw new Error("AI failed to generate icon suggestions.");
    }
    return output;
  }
);


export async function generateIconSuggestions(
  input: GenerateIconSuggestionsInput
): Promise<GenerateIconSuggestionsOutput> {
  return generateIconSuggestionsFlow(input);
}
