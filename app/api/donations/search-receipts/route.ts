import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Donation } from "@/lib/db/models/Donation";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const rateLimitResponse = await enforceRateLimit(req, "donations:search-receipts");
    if (rateLimitResponse) return rateLimitResponse;
    
    const body = await req.json().catch(() => ({}));
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    }

    await connectToDatabase();

    const donations = await Donation.find({
      mobile: mobile.trim(),
      paymentStatus: "SUCCESS",
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!donations || donations.length === 0) {
      return NextResponse.json(
        { error: "No completed donations were found with the provided mobile number." },
        { status: 404 }
      );
    }

    // Map to sanitized output to prevent ID leakage
    const receipts = donations.map((donation: any) => ({
      donationId: donation.donationId,
      createdAt: donation.createdAt,
      name: donation.name,
      gothra: donation.gothra,
      nakshatra: donation.nakshatra,
      mobile: donation.mobile,
      email: donation.email,
      sevaName: donation.sevaName,
      amount: donation.amount,
      paymentMethod: donation.paymentMethod,
      paymentSource: donation.paymentSource,
      status: donation.status,
      receiptNumber: donation.receiptNumber,
      processingCharge: donation.processingCharge || 0,
      totalPaid: donation.totalPaid || donation.amount,
    }));

    return NextResponse.json({ receipts });
  } catch (error: any) {
    if (error.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    console.error("Error searching receipts:", error);
    return NextResponse.json(
      { error: "No completed donations were found with the provided mobile number." },
      { status: 500 }
    );
  }
}
