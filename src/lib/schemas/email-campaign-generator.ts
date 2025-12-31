import { z } from 'zod';

export const EmailCampaignGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the software product.'),
  discountCode: z.string().optional().describe('An optional discount code to include in the email.'),
  audience: z.string().describe('The target audience for the email campaign.'),
});
export type EmailCampaignGeneratorInput = z.infer<typeof EmailCampaignGeneratorInputSchema>;

export const EmailCampaignGeneratorOutputSchema = z.object({
  content: z.string().describe('The generated HTML content for the email campaign.'),
});
export type EmailCampaignGeneratorOutput = z.infer<typeof EmailCampaignGeneratorOutputSchema>;
