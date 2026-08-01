export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { donationRepository, type DonationPlain } from "@/lib/db/repositories/donationRepository";

function publicDonation(donation: DonationPlain) {
  return {
    donationId: donation.donationId,
    name: donation.name,
    sevaName: donation.sevaName,
    amount: donation.amount,
    status: donation.status,
    paymentStatus: donation.paymentStatus,
    paymentGateway: donation.paymentGateway,
    receiptNumber: donation.receiptNumber,
    refundStatus: donation.refundStatus,
    refundedAmount: donation.refundedAmount,
    reconciliationStatus: donation.reconciliationStatus,
    lastReconciledAt: donation.lastReconciledAt,
    transactionTime: donation.transactionTime,
    donationType: donation.donationType,
    bookingStatus: donation.bookingStatus,
    createdAt: donation.createdAt,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const transactionId = url.searchParams.get("merchantTransactionId") || url.searchParams.get("razorpayOrderId") || url.searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }

    let donation = await donationRepository.findByRazorpayOrderId(transactionId);
    if (!donation) {
      donation = await donationRepository.findByMerchantTransactionId(transactionId);
    }
    if (!donation) {
      donation = await donationRepository.findById(transactionId);
    }

    if (!donation) {
      return NextResponse.json({ success: false, error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      paymentStatus: donation.paymentStatus,
      donation: publicDonation(donation),
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Payment status route error", { message: error?.message });
    }
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

