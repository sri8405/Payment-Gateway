import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { RazorpayService } from "@/lib/payment/RazorpayService";
import { calculatePaymentFees } from "@/lib/payment/paymentFees";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getIdempotencyKey, checkIdempotency, storeIdempotency } from "@/lib/utils/idempotency";

const donationIdPattern = /^DON-\d{8}-\d{10}$/;

function isValidDonationIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 64 &&
    (donationIdPattern.test(value) || Types.ObjectId.isValid(value))
  );
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(req, "payments:create-order");
  if (rateLimitResponse) return rateLimitResponse;

  const idempotencyKey = getIdempotencyKey(req);
  if (idempotencyKey) {
    const cached = checkIdempotency(idempotencyKey);
    if (cached.hit) {
      return NextResponse.json(cached.response);
    }
  }

  try {
    const { donationId } = await req.json();

    if (!isValidDonationIdentifier(donationId)) {
      return NextResponse.json(
        { success: false, error: "A valid donation ID is required" },
        { status: 400 }
      );
    }

    const donation = await donationRepository.findById(donationId);
    if (!donation) {
      return NextResponse.json(
        { success: false, error: "Donation not found" },
        { status: 404 }
      );
    }

    if (donation.status === "VERIFIED" || donation.paymentStatus === "SUCCESS") {
      return NextResponse.json(
        { success: false, error: "Payment has already been completed for this donation" },
        { status: 409 }
      );
    }

    if (!["PENDING", "INITIATED"].includes(donation.paymentStatus)) {
      return NextResponse.json(
        { success: false, error: "Donation is not eligible for payment order creation" },
        { status: 409 }
      );
    }

    // Calculate payment processing fees (server-side only)
    const fees = calculatePaymentFees(donation.amount);

    if (fees.totalPayablePaise < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum payment amount is Rs 1 (100 paise)" },
        { status: 400 }
      );
    }

    // Create Razorpay order with TOTAL PAYABLE (seva + processing charges)
    const order = await RazorpayService.createOrder(
      fees.totalPayablePaise,
      "INR",
      donation.donationId
    );

    const { Donation } = await import("@/lib/db/models/Donation");
    const { connectToDatabase } = await import("@/lib/db/connect");
    await connectToDatabase();

    const updatedDonation = await Donation.findOneAndUpdate(
      {
        donationId: donation.donationId,
        status: "PENDING",
        paymentStatus: { $in: ["PENDING", "INITIATED"] },
      },
      {
        $set: {
          razorpayOrderId: order.orderId,
          paymentStatus: "INITIATED",
          paymentGateway: "Razorpay",
          gatewayFee: fees.gatewayFee,
          gatewayGST: fees.gatewayGST,
          processingCharge: fees.processingCharge,
          totalPaid: fees.totalPayable,
        },
      },
      { new: true }
    ).lean();

    if (!updatedDonation) {
      return NextResponse.json(
        { success: false, error: "Donation is no longer eligible for payment order creation" },
        { status: 409 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("Razorpay order created", { donationId: donation.donationId });
    }

    const successPayload = {
      success: true,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      donationId: donation.donationId,
      prefill: {
        name: donation.name,
        contact: donation.mobile || "",
        email: donation.email || "",
      },
      notes: {
        sevaName: donation.sevaName,
      },
      // Fee breakdown for frontend display
      fees: {
        sevaAmount: fees.sevaAmount,
        gatewayFee: fees.gatewayFee,
        gatewayGST: fees.gatewayGST,
        processingCharge: fees.processingCharge,
        totalPayable: fees.totalPayable,
      },
    };

    if (idempotencyKey) {
      storeIdempotency(idempotencyKey, successPayload);
    }

    return NextResponse.json(successPayload);
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Create order route error", {
        type: error?.constructor?.name,
        message: error?.message,
      });
    }

    if (
      error?.message?.toLowerCase().includes("authentication") ||
      error?.message?.toLowerCase().includes("credentials")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway authentication failed. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
        },
        { status: 401 }
      );
    }

    if (error?.message?.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
