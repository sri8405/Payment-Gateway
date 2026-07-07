import { NextRequest } from "next/server";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { donationSchema } from "@/lib/validations/donation";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";
import { generateDonationId } from "@/lib/utils/donationId";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = donationSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("BAD_REQUEST", parsed.error.issues[0]?.message || "Invalid donation");
    }

    const seva = await sevaRepository.findById(parsed.data.sevaId);

    if (!seva || !seva.active) {
      throw new AppError("BAD_REQUEST", "Selected seva is not available");
    }

    // Validate amount based on seva pricing mode to prevent client-side modifications
    if (seva.pricingMode === "fixed") {
      const expectedAmount = seva.fixedAmount || seva.suggestedAmount;
      if (parsed.data.amount !== expectedAmount) {
        throw new AppError("BAD_REQUEST", `Invalid amount for fixed pricing mode. Expected ₹${expectedAmount}`);
      }
    } else if (seva.pricingMode === "options") {
      const allowedOptions = seva.amountOptions && seva.amountOptions.length > 0
        ? seva.amountOptions
        : [100, 250, 500, 750, 1000];
      if (!allowedOptions.includes(parsed.data.amount)) {
        throw new AppError("BAD_REQUEST", "Invalid amount option selected");
      }
    } else if (seva.pricingMode === "custom") {
      if (parsed.data.amount <= 0) {
        throw new AppError("BAD_REQUEST", "Amount must be greater than zero");
      }
    }

    const donationId = await generateDonationId();
    const donation = await donationRepository.create({
      donationId,
      name: parsed.data.name,
      gothra: parsed.data.gothra,
      mobile: parsed.data.mobile || undefined,
      email: parsed.data.email || undefined,
      sevaId: seva._id,
      sevaName: seva.name,
      amount: parsed.data.amount,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentSource: "Online",
      donationType: "SEVA",
      bookingStatus: "BOOKED",
      paymentLogs: []
    });

    return Response.json({ donation });
  } catch (error) {
    console.error("Donation route error:", error);
    return apiErrorResponse(error);
  }
}
