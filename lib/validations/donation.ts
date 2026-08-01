import { z } from "zod";

const mandatoryEmail = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("A valid email address is required");

const optionalMobile = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^[6-9]\d{9}$/.test(value), "Enter a valid 10 digit mobile number");

export const donationSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  gothra: z.string().trim().min(2, "Gothra is required"),
  nakshatra: z.string().trim().optional().or(z.literal("")),
  mobile: optionalMobile,
  email: mandatoryEmail,
  sevaId: z.string().min(1, "Select a seva"),
  amount: z.coerce.number().int().positive("Amount must be greater than zero")
});

export type DonationInput = z.infer<typeof donationSchema>;

export const offlineBookingSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  gothra: z.string().trim().optional().or(z.literal("")),
  nakshatra: z.string().trim().optional().or(z.literal("")),
  mobile: z.string().trim().refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a valid 10 digit mobile number"),
  email: mandatoryEmail,
  sevaId: z.string().min(1, "Select a seva"),
  amount: z.coerce.number().int().positive("Amount must be greater than zero"),
  paymentMethod: z.enum(["Cash", "Manual UPI", "Card", "Cheque", "Other"], {
    required_error: "Select a payment method",
  }),
  bookingDate: z.string().optional()
});

export type OfflineBookingInput = z.infer<typeof offlineBookingSchema>;
