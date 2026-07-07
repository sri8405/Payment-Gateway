import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { offlineBookingSchema } from "@/lib/validations/donation";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { generateReceiptNumber } from "@/lib/utils/receiptNumber";
import { connectToDatabase } from "@/lib/db/connect";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = offlineBookingSchema.parse(body);

    await connectToDatabase();

    const seva = await sevaRepository.findById(data.sevaId);
    if (!seva || !seva.active) {
      return NextResponse.json({ error: "Invalid or inactive Seva selected" }, { status: 400 });
    }

    // Verify amount based on pricing mode
    if (seva.pricingMode === "fixed") {
      const fixedAmount = seva.fixedAmount || seva.suggestedAmount;
      if (data.amount !== fixedAmount) {
        return NextResponse.json({ error: `Amount must be exactly ₹${fixedAmount} for this Seva` }, { status: 400 });
      }
    } else if (seva.pricingMode === "options") {
      const allowedOptions = [100, 250, 500, 750, 1000];
      if (!allowedOptions.includes(data.amount)) {
        return NextResponse.json({ error: "Invalid amount option selected" }, { status: 400 });
      }
    }

    const donationId = `GS${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    const merchantTransactionId = `OFFLINE-${yyyymmdd}-${randomHex.toUpperCase()}`;
    const receiptNumber = await generateReceiptNumber();

    const bookingDate = data.bookingDate ? new Date(data.bookingDate) : now;

    const donationData = {
      donationId,
      name: data.name,
      gothra: data.gothra || "",
      nakshatra: data.nakshatra || "",
      mobile: data.mobile,
      email: data.email || "",
      sevaId: data.sevaId,
      sevaName: seva.name,
      amount: data.amount,
      status: "VERIFIED" as const,
      paymentStatus: "SUCCESS",
      paymentSource: "Offline",
      merchantTransactionId,
      paymentMethod: data.paymentMethod,
      receiptNumber,
      transactionTime: now,
      donationType: "SEVA",
      bookingStatus: "COMPLETED",
      paymentLogs: [{ status: "SUCCESS", timestamp: now, rawResponse: { source: "Admin Offline Entry" } }],
      enteredBy: session.user.email || session.user.name || "Admin",
      createdAt: bookingDate,
    };

    const newDonation = await donationRepository.create(donationData);

    return NextResponse.json({ success: true, donation: newDonation });
  } catch (error: any) {
    console.error("Offline Booking API Error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create offline booking" }, { status: 500 });
  }
}
