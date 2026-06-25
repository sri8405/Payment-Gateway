import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

/**
 * Validates a UPI VPA (Virtual Payment Address).
 * Format: localPart@provider
 * localPart: alphanumeric, dots, hyphens, underscores (3–256 chars total)
 */
const upiIdSchema = z
  .string()
  .trim()
  .min(1, "UPI ID is required")
  .refine(
    (value) => /^[\w.-]+@[\w]+$/.test(value),
    "Enter a valid UPI ID (e.g. username@bank)"
  );

export const DEFAULT_PAYMENT_APP_OPTIONS = [
  { value: "generic", label: "Generic UPI" },
  { value: "phonepe", label: "PhonePe" },
  { value: "gpay", label: "Google Pay" },
  { value: "paytm", label: "Paytm" }
] as const;

export type DefaultPaymentApp = (typeof DEFAULT_PAYMENT_APP_OPTIONS)[number]["value"];

export const templeSettingsSchema = z.object({
  templeName: z.string().trim().min(2, "Temple name is required"),
  templeDescription: optionalText,
  upiId: upiIdSchema,
  upiDisplayName: z.string().trim().min(2, "UPI display name is required"),
  /** Human-readable account holder / receiver name shown on payment screens */
  receiverName: z
    .string()
    .trim()
    .min(1, "Receiver name is required")
    .max(100, "Receiver name must be 100 characters or fewer"),
  /** Preferred default payment app */
  defaultPaymentApp: z
    .enum(["generic", "phonepe", "gpay", "paytm"])
    .default("generic"),
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
