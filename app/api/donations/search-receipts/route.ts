import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Donation } from "@/lib/db/models/Donation";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const rateLimitResponse = await enforceRateLimit(req, "donations:search-receipts");
    if (rateLimitResponse) return rateLimitResponse;
    
    const body = await req.json().catch(() => ({}));
    const { mobile, name, gothra } = body;

    if (!mobile || !name || !gothra) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();

    // Escape special regex characters in name and gothra
    const escapeRegex = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };

    // Case-insensitive, ignoring leading/trailing spaces
    const nameRegex = new RegExp(`^\\s*${escapeRegex(name.trim())}\\s*$`, "i");
    const gothraRegex = new RegExp(`^\\s*${escapeRegex(gothra.trim())}\\s*$`, "i");

    const donations = await Donation.find({
      mobile: mobile.trim(),
      name: nameRegex,
      gothra: gothraRegex,
      paymentStatus: "SUCCESS",
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!donations || donations.length === 0) {
      return NextResponse.json(
        { error: "No completed donations were found with the provided information." },
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
      { error: "No completed donations were found with the provided information." },
      { status: 500 }
    );
  }
}
