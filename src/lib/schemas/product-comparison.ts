
import { z } from 'zod';

export const CompetitorInfoSchema = z.object({
    name: z.string(),
    brand: z.string(),
    price: z.number(),
    shortDescription: z.string()
});
export type CompetitorInfo = z.infer<typeof CompetitorInfoSchema>;

export const ProductComparisonInputSchema = z.object({
  productName: z.string(),
  productBrand: z.string(),
  productPrice: z.number(),
  productShortDescription: z.string(),
  competitors: z.array(CompetitorInfoSchema),
});
export type ProductComparisonInput = z.infer<typeof ProductComparisonInputSchema>;

export const ProductComparisonOutputSchema = z.object({
    mainProduct: z.object({
        name: z.string(),
        brand: z.string(),
        price: z.number(),
    }),
    competitors: z.array(z.object({
        name: z.string(),
        brand: z.string(),
        price: z.number(),
    })),
    comparison: z.array(z.object({
        feature: z.string().describe('The feature being compared (e.g., "Mô hình định giá", "Hiệu suất", "Tính năng chính", "Đối tượng người dùng").'),
        mainProductValue: z.string().describe('The value or description of the feature for the main product.'),
        competitorValues: z.array(z.object({
            competitorName: z.string(),
            value: z.string().describe('The value or description of the feature for the competitor.'),
        })),
    })),
});
export type ProductComparisonOutput = z.infer<typeof ProductComparisonOutputSchema>;
