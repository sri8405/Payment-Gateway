import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const templeSettingsSchema = z.object({
  templeName: z.string().trim().min(2, "Temple name is required"),
  templeDescription: optionalText,
  upiId: z.string().trim().min(3, "UPI ID is required"),
  upiDisplayName: z.string().trim().min(2, "UPI display name is required"),
  contactNumber: optionalText.refine(
    (value) => !value || /^[6-9]\d{9}$/.test(value),
    "Enter a valid contact number"
  ),
  email: optionalText.refine(
    (value) => !value || z.string().email().safeParse(value).success,
    "Enter a valid email address"
  ),
  address: optionalText,
  logoUrl: optionalText,
  receiptFooter: optionalText
});

export type TempleSettingsInput = z.infer<typeof templeSettingsSchema>;
