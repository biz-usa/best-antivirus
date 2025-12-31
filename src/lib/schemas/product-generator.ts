

import { z } from 'zod';
import type { Category } from '../types';

const CategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
});

export const ProductDetailsInputSchema = z.object({
  name: z.string().describe('The name of the software product.'),
  categories: z.array(CategorySchema).describe('A list of available product categories in the store.'),
});
export type ProductDetailsInput = z.infer<typeof ProductDetailsInputSchema>;

export const ProductDetailsOutputSchema = z.object({
  name: z.string().describe('The official name of the software product.'),
  brand: z.string().describe('The brand or company that makes the software.'),
  categoryId: z.string().describe('The slug of the most appropriate category for this product from the provided list.'),
  shortDescription: z
    .string()
    .describe('A short, compelling description of the product (around 150 characters).'),
  longDescription: z
    .string()
    .describe('A detailed description of the product, its features, and benefits (around 500 characters).'),
  price: z.number().describe('A realistic price for this software product in Vietnamese Dong (VND), based on web search results for the official Manufacturer Suggested Retail Price (MSRP).'),
  salePrice: z.number().optional().describe('A realistic average market sale price for this product in Vietnamese Dong (VND), based on web search results. Can be the same as price if no sale is found.'),
  sku: z.string().describe('A generated Stock Keeping Unit (SKU) for our store, following a format like "SGS-BRAND-PROD".'),
  mfr: z
    .string()
    .describe('The official Manufacturer Part Number (MFR) or SKU for the product, as found on official sites. This is a mandatory field.'),
  imageHint: z
    .string()
    .describe('Two or three keywords in English that can be used to find a relevant stock photo for this product. e.g., "photo editing software"'),
});
export type ProductDetailsOutput = z.infer<typeof ProductDetailsOutputSchema>;

export const GenerateProductDetailsOutputSchema = z.object({
  details: ProductDetailsOutputSchema,
  imageUrl: z.string().url(),
});
export type GenerateProductDetailsOutput = z.infer<typeof GenerateProductDetailsOutputSchema>;
