import {
  type PaymentParams,
  type PaymentResult,
  type PaymentService,
  type VerificationResult
} from "@/lib/payment/PaymentService";

/**
 * Build a standards-compliant UPI URL.
 *
 * We manually construct the query string instead of using URLSearchParams
 * because URLSearchParams encodes `@` as `%40` and spaces as `+`, which
 * causes some UPI apps (notably PhonePe) to reject the transaction with
 * "Transaction declined due to security reasons."
 *
 * The UPI deep link spec expects minimal encoding: spaces as `%20`,
 * and `@` left as-is.
 */
function buildUpiUrl(pa: string, pn: string, am: number): string {
  const safePn = pn.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const encodedPn = safePn.replace(/ /g, "%20");
  return `upi://pay?pa=${pa}&pn=${encodedPn}&am=${am}&cu=INR&tn=Seva`;
}

export class UPIPaymentService implements PaymentService {
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    return {
      reference: params.donationId,
      paymentUrl: buildUpiUrl(params.upiId, params.upiDisplayName, params.amount)
    };
  }

  async verifyPayment(reference: string): Promise<VerificationResult> {
    return { reference, verified: false };
  }
}

export const paymentService = new UPIPaymentService();
