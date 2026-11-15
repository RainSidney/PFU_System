import { z } from 'zod';

const variantSchema =z.object({
    sku: z.string().min(1, 'SKU is required'),
    size: z.string().min(1, 'Size is required'),
    color: z.string().min(1, 'Color is required'),
    stock: z.number().int().min(0, 'stock cannot be negative').default(0)
});

export const createProductSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    category_id: z.number().int().positive().nullable().optional(),
    description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    price: z.number().positive('Price must be greated than 0'),
    available_sizes: z.array(z.string()).default([]),
    available_colors: z.array(z.string()).default([]),
    variants: z.array(variantSchema).default([])
});

export const updateProductSchema = createProductSchema
    .omit({ variants: true})
    .extend({ is_active: z. boolean().default(true) });

