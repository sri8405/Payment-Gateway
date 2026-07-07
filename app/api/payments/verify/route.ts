import { NextResponse } from "next/server";
import { PhonePeService } from "@/lib/payment/PhonePeService";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { generateReceiptNumber } from "@/lib/utils/receiptNumber";


export async function POST(req: Request) {
  try {
    const { merchantTransactionId } = await req.json();

    if (!merchantTransactionId) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }

    const result = await PhonePeService.verifyPayment(merchantTransactionId);
    
    let updatedDonation;
    if (result.success && result.paymentStatus === 'SUCCESS') {
       const existingDonation = await donationRepository.findByMerchantTransactionId(merchantTransactionId);
       const receiptNumber = existingDonation?.receiptNumber || await generateReceiptNumber();

       updatedDonation = await donationRepository.updatePaymentStatus(merchantTransactionId, {
         paymentStatus: 'SUCCESS',
         phonePeTransactionId: result.transactionId,
         transactionTime: new Date(),
       });
       
       const { newValues } = await donationRepository.updateById(updatedDonation.donationId, {
         status: 'VERIFIED',
         receiptNumber
       });
       updatedDonation = newValues;
       // A separate query might be needed to set the receipt number directly if updateById doesn't support it, 
       // but for now updatePaymentStatus handles the payment flow.
    } else {
       updatedDonation = await donationRepository.updatePaymentStatus(merchantTransactionId, {
         paymentStatus: result.paymentStatus || 'FAILED',
         phonePeTransactionId: result.transactionId
       });
    }

    return NextResponse.json({ success: true, paymentStatus: result.paymentStatus, donation: updatedDonation });
  } catch (error: any) {
    console.error("Verify Payment Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
