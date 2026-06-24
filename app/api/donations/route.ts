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
      status: "PENDING"
    });

    return Response.json({ donation });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
