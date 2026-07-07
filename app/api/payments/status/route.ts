import { NextResponse } from "next/server";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const merchantTransactionId = url.searchParams.get("merchantTransactionId");

    if (!merchantTransactionId) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }

    const donation = await donationRepository.findByMerchantTransactionId(merchantTransactionId);
    if (!donation) {
      return NextResponse.json({ success: false, error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, paymentStatus: donation.paymentStatus, donation });
  } catch (error: any) {
    console.error("Payment Status Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
