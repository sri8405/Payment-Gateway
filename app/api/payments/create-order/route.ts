import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/payment/RazorpayService";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export async function POST(req: Request) {
  try {
    const { donationId } = await req.json();

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: "Donation ID is required" },
        { status: 400 }
      );
    }

    console.log("Incoming donation ID:", donationId);
    console.log("MongoDB query for donationId:", donationId);
    const donation = await donationRepository.findById(donationId);
    if (!donation) {
      return NextResponse.json(
        { success: false, error: "Donation not found" },
        { status: 404 }
      );
    }

    // Amount in paise (Razorpay expects smallest currency unit)
    const amountInPaise = donation.amount * 100;

    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum payment amount is ₹1 (100 paise)" },
        { status: 400 }
      );
    }

    // ── Pre-call diagnostic log ──────────────────────────────────────────
    console.log("=== RAZORPAY CREATE ORDER REQUEST ===");
    console.log("Donation ID          :", donation.donationId);
    console.log("Amount (₹)           :", donation.amount);
    console.log("Amount (paise)       :", amountInPaise);
    console.log("Receipt              :", donation.donationId);
    console.log("Currency             :", "INR");
    console.log("RAZORPAY_KEY_ID      :", process.env.RAZORPAY_KEY_ID);
    console.log("KEY_SECRET present   :", Boolean(process.env.RAZORPAY_KEY_SECRET));
    console.log("=====================================");

    const order = await RazorpayService.createOrder(
      amountInPaise,
      "INR",
      donation.donationId
    );
    console.log("Razorpay order creation result:", order);

    // Store Razorpay order ID and set payment status in a single atomic update
    const { Donation } = await import("@/lib/db/models/Donation");
    const { connectToDatabase } = await import("@/lib/db/connect");
    await connectToDatabase();
    await Donation.findOneAndUpdate(
      { donationId: donation.donationId },
      {
        $set: {
          razorpayOrderId: order.orderId,
          paymentStatus: "INITIATED",
          paymentGateway: "Razorpay",
        },
      }
    );

    return NextResponse.json({
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
    });
  } catch (error: any) {
    // ── Full diagnostics ──────────────────────────────────────────────────
    console.error("=== CREATE ORDER ROUTE ERROR ===");
    console.error("Type              :", error?.constructor?.name);
    console.error("Message           :", error?.message);
    console.error("RAZORPAY_KEY_ID   :", process.env.RAZORPAY_KEY_ID);
    console.error("KEY_SECRET set    :", Boolean(process.env.RAZORPAY_KEY_SECRET));
    console.error("Stack             :", error instanceof Error ? error.stack : "(no stack)");
    console.error("JSON              :", JSON.stringify(error, null, 2));
    console.error("================================");

    // Razorpay authentication failure — 401 is the correct response here because
    // the *gateway* rejected us with auth failure, not the caller.
    if (
      error?.message?.toLowerCase().includes("authentication") ||
      error?.message?.toLowerCase().includes("credentials")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway authentication failed. The Razorpay API key pair is invalid or has been regenerated. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
          detail: error.message,
        },
        { status: 401 }
      );
    }

    // Donation not found (thrown by repository as AppError)
    if (error?.message?.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    // All other errors — do NOT swallow; surface the real message
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
