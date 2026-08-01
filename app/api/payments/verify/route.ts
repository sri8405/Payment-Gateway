export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server";
import { RazorpayService } from "@/lib/payment/RazorpayService";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { processRazorpaySuccess } from "@/lib/payment/paymentLifecycle";
import { enforceRateLimit } from "@/lib/rateLimit";
import { generateSecureToken } from "@/lib/utils/secureToken";

export async function POST(req: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(req, "payments:verify");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
        },
        { status: 400 }
      );
    }

    let isValid = false;
    try {
      isValid = RazorpayService.verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
    } catch {
      return NextResponse.json(
        { success: false, error: "Signature verification failed" },
        { status: 400 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment signature verification failed. Payment NOT marked as completed." },
        { status: 400 }
      );
    }

    const donation = await donationRepository.findByRazorpayOrderId(razorpay_order_id);
    if (!donation) {
      return NextResponse.json(
        { success: false, error: "Donation not found for this order" },
        { status: 404 }
      );
    }

    let captured = false;
    try {
      const payment = await RazorpayService.fetchPayment(razorpay_payment_id) as any;
      captured = payment?.status === "captured";
    } catch {
      captured = false;
    }

    const updated = await processRazorpaySuccess({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      signatureVerified: true,
      captured,
      source: "verify",
    });

    const finalDonationId = updated?.donationId || donation.donationId;
    const secureToken = generateSecureToken(finalDonationId);

    return NextResponse.json({
      success: true,
      paymentStatus: "SUCCESS",
      donationId: finalDonationId,
      secureToken,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Verify payment route error", { message: error?.message });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

