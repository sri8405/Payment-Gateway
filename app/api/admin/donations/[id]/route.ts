import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { adminDonationUpdateSchema } from "@/lib/validations/adminDonation";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const body = await request.json();
    const parsed = adminDonationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("BAD_REQUEST", parsed.error.issues[0]?.message || "Invalid donation");
    }

    const seva = await sevaRepository.findById(parsed.data.sevaId);
    if (!seva) {
      throw new AppError("BAD_REQUEST", "Selected seva is not available");
    }

    const { id } = await params;
    const before = await donationRepository.findById(id);
    if (!before) {
      throw new AppError("NOT_FOUND", "Donation not found");
    }

    const updated = await donationRepository.updateById(id, {
      name: parsed.data.name,
      gothra: parsed.data.gothra,
      mobile: parsed.data.mobile || undefined,
      email: parsed.data.email || undefined,
      sevaId: seva._id,
      sevaName: seva.name,
      amount: parsed.data.amount,
      status: parsed.data.status
    });

    await auditLogRepository.create({
      adminId,
      action: "UPDATE",
      collection: "Donation",
      recordId: before.donationId,
      oldValues: updated.oldValues,
      newValues: updated.newValues
    });

    return Response.json({ donation: updated.newValues });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
