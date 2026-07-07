import { z } from "zod";

export const sevaSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().trim().optional(),
  suggestedAmount: z.coerce.number().int().positive("Suggested amount must be positive"),
  active: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  pricingMode: z.enum(['fixed', 'custom', 'options']).default('fixed'),
  fixedAmount: z.coerce.number().int().positive().optional(),
  defaultAmount: z.coerce.number().int().positive().optional(),
  amountOptions: z.array(z.coerce.number().int().positive()).optional().default([]),
  category: z.string().trim().optional().or(z.literal('')),
  imageUrl: z.string().trim().optional().or(z.literal(''))
}).refine((data) => {
  if (data.pricingMode === 'fixed') {
    return data.fixedAmount || data.suggestedAmount;
  }
  if (data.pricingMode === 'custom') {
    return data.defaultAmount || data.suggestedAmount;
  }
  if (data.pricingMode === 'options') {
    return data.amountOptions && data.amountOptions.length > 0;
  }
  return true;
}, {
  message: "Amount is required based on pricing mode (for options, you must provide at least one valid amount).",
  path: ["pricingMode"]
});

export type SevaInput = z.infer<typeof sevaSchema>;
