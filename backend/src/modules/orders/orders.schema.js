import { z } from "zod";

const orderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  size: z.string().optional().default(""),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  image: z.string().optional().default(""),
});

export const orderSchema = z.object({
  id: z.string().min(1),
  customer: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  phone: z.string().optional().default(""),
  dni: z.string().optional().default(""),
  status: z.string().default("pending"),
  statusDetail: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  assignedTo: z.string().uuid().optional().or(z.literal("")).default(""),
  total: z.number().nonnegative(),
  createdAt: z.string().optional().default(""),
  items: z.array(orderItemSchema),
});

export const ordersBulkSchema = z.object({
  items: z.array(orderSchema),
});
