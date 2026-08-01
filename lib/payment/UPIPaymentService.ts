import {
  type PaymentParams,
  type PaymentResult,
  type PaymentService,
  type VerificationResult
} from "@/lib/payment/PaymentService";

/**
 * Build a maximally compatible UPI deep link for personal UPI accounts.
 */
function buildPersonalUpiUrl(
  upiId: string,
  receiverName: string,
  amount: number,
  isAndroid = false
): string {
  if (!upiId || !upiId.includes('@')) {
    throw new Error('Invalid UPI ID format');
  }

  const cleanName = receiverName.trim().replace(/[^\w\s]/g, '');
  const encodedName = cleanName.replace(/ /g, '%20');
  const formattedAmount = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);

  const upiParams = [
    `pa=${upiId}`,
    `pn=${encodedName}`,
    `am=${formattedAmount}`,
    `cu=INR`
  ].join('&');

  return isAndroid
    ? `intent://pay?${upiParams}#Intent;scheme=upi;end`
    : `upi://pay?${upiParams}`;
}

export class UPIPaymentService implements PaymentService {
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    const paymentUrl = buildPersonalUpiUrl(
      params.upiId,
      params.receiverName,
      params.amount,
      params.isAndroid === true
    );

    return {
      reference: params.donationId,
      paymentUrl
    };
  }

  async verifyPayment(reference: string): Promise<VerificationResult> {
    return { reference, verified: false };
  }
}

export const paymentService = new UPIPaymentService();
