import { z } from "zod";

const orderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  size: z.string().optional().default(""),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  image: z.string().optional().default(""),
});

const statusHistorySchema = z.object({
  at: z.string().optional().default(""),
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
  actor: z.string().optional().default(""),
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
  assignedTo: z.string().optional().default(""),
  total: z.number().nonnegative(),
  createdAt: z.string().optional().default(""),
  items: z.array(orderItemSchema),
  statusHistory: z.array(statusHistorySchema).optional().default([]),
});

export const ordersBulkSchema = z.object({
  items: z.array(orderSchema),
});

export const orderCreateSchema = orderSchema.omit({ assignedTo: true }).extend({
  id: z.string().min(1).optional(),
  status: z.string().optional().default("Pendiente"),
  createdAt: z.string().optional().default(""),
});
