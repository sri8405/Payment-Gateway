import {
  type PaymentParams,
  type PaymentResult,
  type PaymentService,
  type VerificationResult
} from "@/lib/payment/PaymentService";

export class UPIPaymentService implements PaymentService {
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    const query = new URLSearchParams({
      pa: params.upiId,
      pn: params.upiDisplayName,
      am: String(params.amount),
      cu: "INR",
      tn: params.donationId
    });

    return {
      reference: params.donationId,
      paymentUrl: `upi://pay?${query.toString()}`
    };
  }

  async verifyPayment(reference: string): Promise<VerificationResult> {
    return { reference, verified: false };
  }
}

export const paymentService = new UPIPaymentService();
