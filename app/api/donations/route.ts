import { type NextRequest } from "next/server";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { donationSchema } from "@/lib/validations/donation";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";
import { generateDonationId } from "@/lib/utils/donationId";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(request, "donations:create");
  if (rateLimitResponse) return rateLimitResponse;

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

    if (seva.pricingMode === "fixed") {
      const expectedAmount = seva.fixedAmount || seva.suggestedAmount;
      if (parsed.data.amount !== expectedAmount) {
        throw new AppError("BAD_REQUEST", `Invalid amount for fixed pricing mode. Expected Rs ${expectedAmount}`);
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

    const donationId = generateDonationId();
    const donation = await donationRepository.create({
      donationId,
      name: parsed.data.name,
      gothra: parsed.data.gothra,
      mobile: parsed.data.mobile || undefined,
      email: parsed.data.email || undefined,
      sevaId: seva._id,
      sevaName: seva.name,
      amount: parsed.data.amount,
      gatewayFee: 0,
      gatewayGST: 0,
      processingCharge: 0,
      totalPaid: 0,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentSource: "Online",
      donationType: "SEVA",
      bookingStatus: "BOOKED",
      paymentLogs: []
    });

    return Response.json({ donation });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Donation route error", error);
    }
    return apiErrorResponse(error);
  }
}
