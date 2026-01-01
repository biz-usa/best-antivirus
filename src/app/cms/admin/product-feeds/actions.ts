
'use server';

import { getProducts } from '@/lib/data';
import { create } from 'xmlbuilder2';
import type { Product, ProductVariant } from '@/lib/types';

export type ExportFormat = 'xml' | 'csv' | 'txt';

/**
 * Safely creates and appends an XML element to the parent.
 * It ensures the text content is not null/undefined and properly escapes it.
 * @param parent The parent XML node.
 * @param tagName The name of the new element (e.g., 'g:title').
 * @param textContent The text content for the element.
 */
function createXmlElement(parent: any, tagName: string, textContent: any) {
    if (textContent !== null && textContent !== undefined && String(textContent).trim() !== '') {
        // .txt() handles escaping of special XML characters like <, >, &, etc.
        parent.ele(tagName).txt(String(textContent));
    }
}

function generateXml(products: Product[], baseUrl: string): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('products');

    for (const product of products) {
        // Skip product if it has no variants, as each item in a feed should be sellable.
        if (!product.variants || product.variants.length === 0) {
            continue;
        }

        const product_node = root.ele('product');
        createXmlElement(product_node, 'id', product.id);
        createXmlElement(product_node, 'name', product.name);
        createXmlElement(product_node, 'slug', product.slug);
        createXmlElement(product_node, 'product_link', `${baseUrl}/products/${product.slug}`);
        createXmlElement(product_node, 'brand', product.brand);
        createXmlElement(product_node, 'mfr', product.mfr);
        createXmlElement(product_node, 'category_name', product.category.name);
        createXmlElement(product_node, 'category_slug', product.category.slug);
        createXmlElement(product_node, 'short_description', product.shortDescription);
        createXmlElement(product_node, 'long_description', product.longDescription);
        createXmlElement(product_node, 'image_url', product.imageUrl);
        createXmlElement(product_node, 'license_type', product.licenseType);

        const variants_node = product_node.ele('variants');
        for (const variant of product.variants) {
            const variant_node = variants_node.ele('variant');
            createXmlElement(variant_node, 'id', variant.id);
            createXmlElement(variant_node, 'name', variant.name);
            createXmlElement(variant_node, 'sku', variant.sku);
            createXmlElement(variant_node, 'price', variant.price);
            createXmlElement(variant_node, 'sale_price', variant.salePrice);
        }
    }
    return root.end({ prettyPrint: true });
}

function escapeCsvField(field: any): string {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = String(field);
    // If the field contains a comma, a double quote, or a newline, enclose it in double quotes.
    if (/[",\n]/.test(stringField)) {
        // Within a double-quoted field, any double quote must be escaped by another double quote.
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

function generateFlatData(products: Product[], baseUrl: string) {
    const headers = [
        'product_id', 'product_name', 'slug', 'product_link', 'brand', 'mfr', 'category_name', 'category_slug', 'short_description', 'long_description', 'image_url', 'license_type',
        'variant_id', 'variant_name', 'sku', 'price', 'sale_price'
    ];
    
    const rows: string[][] = [];

    for (const product of products) {
         if (!product.variants || product.variants.length === 0) {
            continue;
        }

        for (const variant of product.variants) {
            const row = [
                product.id!,
                product.name,
                product.slug,
                `${baseUrl}/products/${product.slug}`,
                product.brand,
                product.mfr,
                product.category.name,
                product.category.slug,
                product.shortDescription,
                product.longDescription,
                product.imageUrl,
                product.licenseType,
                variant.id,
                variant.name,
                variant.sku,
                String(variant.price),
                String(variant.salePrice || '')
            ];
            rows.push(row);
        }
    }

    return { headers, rows };
}


function generateCsv(products: Product[], baseUrl: string): string {
    const { headers, rows } = generateFlatData(products, baseUrl);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
         csvContent += row.map(escapeCsvField).join(',') + '\n';
    });
    return csvContent;
}

function generateTxt(products: Product[], baseUrl: string): string {
    const { headers, rows } = generateFlatData(products, baseUrl);
    let txtContent = headers.join('\t') + '\n';
    rows.forEach(row => {
         // For tab-separated, we generally don't need to escape quotes as heavily,
         // but removing newlines and tabs from within fields is good practice.
        const cleanedRow = row.map(field => field.replace(/[\n\t]/g, ' '));
        txtContent += cleanedRow.join('\t') + '\n';
    });
    return txtContent;
}


export async function exportProducts(format: ExportFormat): Promise<{ content: string; fileName: string; contentType: string }> {
    const products = await getProducts();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    if (format === 'xml') {
        const xmlContent = generateXml(products, baseUrl);
        return {
            content: xmlContent,
            fileName: 'products.xml',
            contentType: 'application/xml;charset=utf-8',
        };
    } else if (format === 'csv') {
        const csvContent = generateCsv(products, baseUrl);
        return {
            content: csvContent,
            fileName: 'products.csv',
            contentType: 'text/csv;charset=utf-8',
        };
    } else if (format === 'txt') {
        const txtContent = generateTxt(products, baseUrl);
        return {
            content: txtContent,
            fileName: 'products.txt',
            contentType: 'text/plain;charset=utf-8',
        };
    }

    throw new Error('Định dạng không hợp lệ.');
}
