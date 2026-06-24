import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;

    if (!adminId) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const { status } = await request.json();

    if (status !== "PENDING" && status !== "VERIFIED") {
      throw new AppError("BAD_REQUEST", "Invalid status");
    }

    const { id } = await params;
    const before = await donationRepository.findById(id);
    const donation = await donationRepository.updateStatus(id, status);

    await auditLogRepository.create({
      adminId,
      action: "UPDATE_STATUS",
      collection: "Donation",
      recordId: donation.donationId,
      oldValues: before,
      newValues: donation
    });

    return Response.json({ donation });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
