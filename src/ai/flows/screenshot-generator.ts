
'use server';

/**
 * @fileOverview A flow to generate diverse and relevant screenshots for a product.
 * This flow uses a two-step AI process:
 * 1. Brainstorm a list of relevant screenshot concepts.
 * 2. Generate images based on those concepts.
 */

import { z } from 'zod';
import { ai, getModelByName } from '@/ai/genkit';
import { getDynamicImage } from '@/lib/data';
import type { ScreenshotGeneratorInput, ScreenshotGeneratorOutput } from '@/lib/schemas/screenshot-generator';
import { ScreenshotGeneratorInputSchema, ScreenshotGeneratorOutputSchema } from '@/lib/schemas/screenshot-generator';

// Schema for the brainstorming flow
const ScreenshotIdeasOutputSchema = z.object({
  ideas: z.array(z.string()).length(5).describe("An array of exactly 5 diverse and specific screenshot concepts related to the software. Each idea must be unique, highlight a different aspect, be in English, and focus on specific UI elements, workflows, or data visualizations."),
});

// Step 1: Brainstorm ideas for screenshots using an AI prompt
const generateScreenshotIdeasFlow = ai.defineFlow(
  {
    name: 'generateScreenshotIdeasFlow',
    inputSchema: ScreenshotGeneratorInputSchema,
    outputSchema: ScreenshotIdeasOutputSchema,
  },
  async ({ productName, productDescription }) => {
    const ideasPrompt = ai.definePrompt({
      name: 'screenshotIdeasPrompt',
      model: getModelByName(),
      input: { schema: ScreenshotGeneratorInputSchema },
      output: { schema: ScreenshotIdeasOutputSchema },
      prompt: `You are a creative UI/UX designer. Your task is to brainstorm 5 distinct and visually compelling screenshot ideas for a software product. Based on the product name and description, generate concepts that showcase its key features and user interface in an appealing way.

**Product Name:** "{{productName}}"
**Description:** "{{productDescription}}"

**Requirements:**
- Generate exactly 5 diverse ideas.
- Each idea must be a unique, concrete, and specific search query for an image service.
- The ideas must be in **English**.
- Focus on specific UI elements, workflows, or data visualizations. Make them sound like professional stock photos.
- Good examples: "software dashboard showing layers panel and advanced color grading tools", "application UI with sophisticated 'AI Sky Replacement' filter effect", "split-screen view comparing a photo before and after editing", "close-up on a smart selection tool isolating a complex object from its background", "software's file export dialog with various format options like JPEG, PNG, and TIFF clearly visible".
- Bad examples: "screenshot", "software", "user interface".

Now, generate 5 diverse and high-quality ideas for the product described above.`,
    });

    const { output } = await ideasPrompt({ productName, productDescription });
    if (!output) {
      throw new Error("AI failed to generate screenshot ideas.");
    }
    return output;
  }
);


// Step 2: Main flow that uses the ideas to generate images
const generateScreenshotsFlow = ai.defineFlow(
  {
    name: 'generateScreenshotsFlow',
    inputSchema: ScreenshotGeneratorInputSchema,
    outputSchema: ScreenshotGeneratorOutputSchema,
  },
  async ({ productName, productDescription }) => {
    try {
      // Get the 5 diverse ideas first
      const { ideas } = await generateScreenshotIdeasFlow({ productName, productDescription });

      // Generate an image for each idea
      const imagePromises = ideas.map(idea => {
        // Construct a more specific query for the image generation service
        const query = `software UI, ${idea}`;
        return getDynamicImage(query, 'landscape');
      });

      const urls = await Promise.all(imagePromises);
      
      // Ensure we have exactly 5 URLs, even if some promises fail
      const finalUrls = urls.map(url => url || 'https://picsum.photos/1200/800');
      
      return {
        screenshotUrls: finalUrls as [string, string, string, string, string],
      };

    } catch (error) {
      console.error('Failed to generate dynamic images as screenshots:', error);
      // Fallback to generic placeholders if the entire flow fails
      const fallbackUrls = Array.from({ length: 5 }).map(() => 'https://picsum.photos/1200/800');
      return {
        screenshotUrls: fallbackUrls as [string, string, string, string, string],
      };
    }
  }
);

export async function generateScreenshots(
  input: ScreenshotGeneratorInput
): Promise<ScreenshotGeneratorOutput> {
  return generateScreenshotsFlow(input);
}
