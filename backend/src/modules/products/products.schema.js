import { z } from "zod";

const sizeStockSchema = z.record(z.string(), z.number().int().min(0)).default({});
const imageSourceSchema = z.string().refine((value) => {
  if (value === "") return true;
  if (/^\/(?!\/)\S+$/.test(value)) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "Invalid image source");

export const productSchema = z.object({
  id: z.string().min(1),
  reference: z.string().optional().default(""),
  name: z.string().min(1),
  category: z.string().min(1),
  categoryLabel: z.string().optional().default(""),
  price: z.number().nonnegative(),
  salePrice: z.number().nonnegative().nullable().optional().default(null),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  color: z.string().optional().default(""),
  material: z.string().optional().default(""),
  fit: z.string().optional().default(""),
  badge: z.string().optional().default(""),
  care: z.string().optional().default(""),
  stock: z.string().optional().default("Disponible"),
  image: imageSourceSchema.optional().default(""),
  images: z.array(imageSourceSchema).optional().default([]),
  description: z.string().optional().default(""),
  sizes: z.array(z.string()).optional().default([]),
  sizeStock: sizeStockSchema,
});

export const productsBulkSchema = z.object({
  products: z.array(productSchema),
});
