import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || z.string().email().safeParse(value).success, "Invalid email address");

const optionalMobile = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^[6-9]\d{9}$/.test(value), "Enter a valid 10 digit mobile number");

export const adminDonationUpdateSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  gothra: z.string().trim().min(2, "Gothra is required"),
  mobile: optionalMobile,
  email: optionalEmail,
  sevaId: z.string().min(1, "Select a seva"),
  amount: z.coerce.number().int().positive("Amount must be greater than zero"),
  status: z.enum(["PENDING", "VERIFIED"])
});

export type AdminDonationUpdateInput = z.infer<typeof adminDonationUpdateSchema>;
