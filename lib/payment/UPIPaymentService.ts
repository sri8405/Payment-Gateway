import {
  type PaymentParams,
  type PaymentResult,
  type PaymentService,
  type VerificationResult
} from "@/lib/payment/PaymentService";

/**
 * Generate a unique transaction reference ID for UPI payments.
 * Format: Timestamp + Random suffix to ensure uniqueness.
 * Must be alphanumeric and under 35 characters per NPCI spec.
 */
function generateTransactionReference(): string {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${randomSuffix}`;
}

/**
 * Build a NPCI-compliant UPI URL with all required parameters.
 * 
 * CRITICAL: tr (Transaction Reference) is MANDATORY for merchant transactions.
 * Missing tr parameter causes "Transaction declined due to security reasons" 
 * and "UPI limit reached" errors in all UPI apps.
 * 
 * Required parameters per NPCI UPI specification:
 * - pa = Payee Address (UPI ID)
 * - pn = Payee Name (receiver name) 
 * - tr = Transaction Reference (MANDATORY - unique transaction ID)
 * - tn = Transaction Note (description)
 * - am = Amount (numeric, can have decimals)
 * - cu = Currency (INR)
 */
function buildCompliantUpiUrl(
  upiId: string, 
  receiverName: string, 
  amount: number,
  donationId: string,
  sevaName: string
): string {
  // Generate unique transaction reference (required for UPI compliance)
  const transactionReference = generateTransactionReference();
  
  // Create transaction note with seva information
  const transactionNote = `${sevaName} - Booking ${donationId}`;
  
  // Ensure amount is properly formatted (NPCI allows decimals)
  const formattedAmount = Number(amount).toFixed(2);
  
  // Build URI with all required parameters
  const params = new URLSearchParams({
    pa: upiId,                              // Payee Address (UPI ID)
    pn: receiverName.trim(),                // Payee Name 
    tr: transactionReference,               // Transaction Reference (MANDATORY)
    tn: transactionNote,                    // Transaction Note
    am: formattedAmount,                    // Amount (formatted to 2 decimal places)
    cu: 'INR'                              // Currency
  });
  
  return `upi://pay?${params.toString()}`;
}

export class UPIPaymentService implements PaymentService {
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    const paymentUrl = buildCompliantUpiUrl(
      params.upiId, 
      params.receiverName, 
      params.amount,
      params.donationId,
      params.sevaName
    );
    
    // Log the generated URI for debugging (remove in production)
    console.log('Generated UPI URI:', paymentUrl);
    
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
