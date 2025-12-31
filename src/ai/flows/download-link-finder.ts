
'use server';

/**
 * @fileoverview A flow to find the official download link for a software product.
 */
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import { ai, getModelByName } from '@/ai/genkit';
import { DownloadLinkFinderOutputSchema, type DownloadLinkFinderOutput, DownloadLinkFinderInputSchema, type DownloadLinkFinderInput } from '@/lib/schemas/download-link-finder';

// Export types for consumers
export type { DownloadLinkFinderInput, DownloadLinkFinderOutput };

async function fetchAndParseUrl(url: string): Promise<Document> {
  // In a real-world scenario, you might want to use a more robust headless browser solution
  // that can be deployed to a serverless environment. For simplicity, we fetch directly.
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} with status ${response.status}`);
    }
    const content = await response.text();
    const { document } = new JSDOM(content, { url }).window;
    return document;
  } catch (error) {
    console.error(`Error fetching or parsing URL ${url}:`, error);
    throw new Error(`Could not retrieve content from ${url}.`);
  }
}

function extractRelevantText(document: Document): string {
  ['script', 'style', 'nav', 'footer', 'header', 'aside'].forEach(tag =>
    Array.from(document.getElementsByTagName(tag)).forEach(el => el.remove())
  );
  return document.body.textContent?.replace(/\s+/g, ' ').trim().substring(0, 5000) || '';
}

const downloadLinkFinderFlow = ai.defineFlow(
  {
    name: 'downloadLinkFinderFlow',
    inputSchema: DownloadLinkFinderInputSchema,
    outputSchema: DownloadLinkFinderOutputSchema,
  },
  async ({ productName }) => {
    const downloadLinkFinderPrompt = ai.definePrompt({
        name: 'downloadLinkFinderPrompt',
        model: getModelByName(),
        input: { schema: z.object({ pageTextContent: z.string(), productName: z.string() }) },
        output: { schema: DownloadLinkFinderOutputSchema },
        prompt: `Bạn là một AI chuyên phân tích văn bản trang web để tìm liên kết tải xuống phần mềm.
**Tên sản phẩm cần tìm:** "{{productName}}"
**Nội dung văn bản từ trang web:**
---
{{pageTextContent}}
---
**Yêu cầu:**
1.  Đọc kỹ nội dung văn bản.
2.  Xác định liên kết tải xuống **chính thức** cho sản phẩm. Ưu tiên các liên kết trực tiếp đến tệp .exe, .dmg, .iso, .zip hoặc một trang "Downloads" chuyên dụng.
3.  **HÃY RẤT CẨN THẬN:** Tránh các liên kết quảng cáo, liên kết đến các trang tin tức, bài đánh giá, hoặc các trang không phải là trang chủ chính thức.
4.  Nếu bạn tìm thấy một URL tốt, hãy trả lời nó trong trường 'suggestedUrl'.
5.  Nếu không tìm thấy URL trực tiếp, hãy đưa ra một gợi ý ngắn gọn trong trường 'suggestion' về cách người dùng có thể tìm thấy nó trên trang (ví dụ: "Hãy truy cập trang chủ và tìm mục 'Tải về'").`,
    });

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${productName} official download page`)}`;
    const googleResultsDocument = await fetchAndParseUrl(searchUrl);

    const searchResultLinks = Array.from(googleResultsDocument.querySelectorAll('a[href^="/url?q="]'))
      .map(a => a.getAttribute('href'))
      .filter((href): href is string => href !== null)
      .map(href => new URL(href, 'https://www.google.com').searchParams.get('q'))
      .filter((url): url is string => url !== null && !url.includes('google.com'))
      .slice(0, 3);

    if (searchResultLinks.length === 0) {
      return { suggestedUrl: '', suggestion: 'Không tìm thấy trang web chính thức nào. Hãy thử tìm kiếm thủ công.' };
    }

    const firstUrlToScrape = searchResultLinks[0];
    const pageDocument = await fetchAndParseUrl(firstUrlToScrape);
    const pageTextContent = extractRelevantText(pageDocument);

    const { output } = await downloadLinkFinderPrompt({ pageTextContent, productName });
    return output || { suggestedUrl: '', suggestion: 'Không thể xác định liên kết tải về từ trang web.' };
  }
);


export async function findDownloadLink(input: DownloadLinkFinderInput): Promise<DownloadLinkFinderOutput> {
  return downloadLinkFinderFlow(input);
}
