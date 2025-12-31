
import { z } from 'zod';

export const DownloadLinkFinderInputSchema = z.object({
  productName: z.string().describe('The name of the software product.'),
});
export type DownloadLinkFinderInput = z.infer<typeof DownloadLinkFinderInputSchema>;


export const DownloadLinkFinderOutputSchema = z.object({
  suggestedUrl: z.string().url().optional().describe('The most likely official download URL found.'),
  suggestion: z.string().optional().describe('A helpful text suggestion in Vietnamese if a direct URL is not found (e.g., "Hãy truy cập trang chủ và tìm mục Tải về").'),
});
export type DownloadLinkFinderOutput = z.infer<typeof DownloadLinkFinderOutputSchema>;
