import { z } from 'zod';

export const PageContentEditorInputSchema = z.object({
  existingContent: z.string().describe('The current HTML content of the page.'),
  instruction: z.string().describe('The user\'s instruction on how to edit the content (e.g., "make it more formal", "add a section about shipping").'),
});
export type PageContentEditorInput = z.infer<typeof PageContentEditorInputSchema>;

export const PageContentEditorOutputSchema = z.object({
  newHtmlContent: z.string().describe('The full, updated HTML content for the page body after applying the edits.'),
});
export type PageContentEditorOutput = z.infer<typeof PageContentEditorOutputSchema>;
