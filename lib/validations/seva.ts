import { z } from "zod";

export const sevaSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().trim().optional().or(z.literal("")),
  suggestedAmount: z.coerce.number().int().positive("Suggested amount is required"),
  active: z.coerce.boolean().default(true)
});

export type SevaInput = z.infer<typeof sevaSchema>;
