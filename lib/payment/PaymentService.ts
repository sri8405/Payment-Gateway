export interface PaymentService {
  initiatePayment(params: PaymentParams): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<VerificationResult>;
}

export interface PaymentParams {
  donationId: string;
  amount: number;
  name: string;
  sevaName: string;
  upiId: string;
  upiDisplayName: string;
}

export interface PaymentResult {
  reference: string;
  paymentUrl: string;
}

export interface VerificationResult {
  reference: string;
  verified: boolean;
}
