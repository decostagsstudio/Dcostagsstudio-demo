import { z } from "zod";

const sizeStockSchema = z.record(z.string(), z.number().int().min(0)).default({});

export const productSchema = z.object({
  id: z.string().min(1),
  reference: z.string().optional().default(""),
  name: z.string().min(1),
  category: z.string().min(1),
  categoryLabel: z.string().optional().default(""),
  price: z.number().nonnegative(),
  color: z.string().optional().default(""),
  stock: z.string().optional().default("Disponible"),
  image: z.string().url().optional().or(z.literal("")).default(""),
  images: z.array(z.string().url()).optional().default([]),
  description: z.string().optional().default(""),
  sizes: z.array(z.string()).optional().default([]),
  sizeStock: sizeStockSchema,
});

export const productsBulkSchema = z.object({
  products: z.array(productSchema),
});
