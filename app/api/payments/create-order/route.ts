import { NextResponse } from "next/server";
import { PhonePeService } from "@/lib/payment/PhonePeService";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export async function POST(req: Request) {
  try {
    const { donationId } = await req.json();

    if (!donationId) {
      return NextResponse.json({ success: false, error: "Donation ID is required" }, { status: 400 });
    }

    const donation = await donationRepository.findById(donationId);
    if (!donation) {
      return NextResponse.json({ success: false, error: "Donation not found" }, { status: 404 });
    }

    const merchantTransactionId = `GS_${donationId}_${Date.now()}`;

    const orderResult = await PhonePeService.createOrder({
      merchantTransactionId,
      amount: donation.amount,
      userInfo: { mobile: donation.mobile }
    });

    if (orderResult.success) {
      await donationRepository.updatePaymentStatus(merchantTransactionId, {
        paymentStatus: "INITIATED"
      });
      return NextResponse.json({ success: true, redirectUrl: orderResult.redirectUrl });
    } else {
      return NextResponse.json({ success: false, error: "Failed to initiate payment" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
