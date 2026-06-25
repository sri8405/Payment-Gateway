import {
  type PaymentParams,
  type PaymentResult,
  type PaymentService,
  type VerificationResult
} from "@/lib/payment/PaymentService";

/**
 * Build a standards-compliant UPI URL for maximum compatibility.
 * 
 * Requirements:
 * - pa = UPI ID (no encoding needed for @ symbol)
 * - pn = receiver name (temple/organization name, not devotee name)
 * - am = amount in INR
 * - cu = INR (currency)
 * - No additional parameters (tn, tr, tid etc.) for maximum compatibility
 */
function buildStandardUpiUrl(upiId: string, receiverName: string, amount: number): string {
  // Use encodeURIComponent for proper parameter encoding
  const encodedReceiverName = encodeURIComponent(receiverName.trim());
  return `upi://pay?pa=${upiId}&pn=${encodedReceiverName}&am=${amount}&cu=INR`;
}

export class UPIPaymentService implements PaymentService {
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    return {
      reference: params.donationId,
      paymentUrl: buildStandardUpiUrl(params.upiId, params.receiverName, params.amount)
    };
  }

  async verifyPayment(reference: string): Promise<VerificationResult> {
    return { reference, verified: false };
  }
}

export const paymentService = new UPIPaymentService();
