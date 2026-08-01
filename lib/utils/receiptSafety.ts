import type { PaymentStatus } from "../db/models/Donation";

type ReceiptCandidate = {
  paymentStatus: PaymentStatus;
  razorpayCaptured?: boolean;
  signatureVerified?: boolean;
  razorpayPaymentId?: string;
};

export function canGenerateReceipt(donation: ReceiptCandidate | null | undefined) {
  return Boolean(
    donation &&
      donation.paymentStatus === "SUCCESS" &&
      donation.razorpayCaptured === true &&
      donation.signatureVerified === true &&
      donation.razorpayPaymentId
  );
}
