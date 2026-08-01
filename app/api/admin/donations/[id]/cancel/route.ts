import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { Donation } from "@/lib/db/models/Donation";
import { connectToDatabase } from "@/lib/db/connect";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

type Params = {
  params: Promise<{ id: string }>;
};

const cancellableStatuses = new Set(["PENDING", "INITIATED", "FAILED"]);

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId || session?.user?.role !== "ADMIN") {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "Cancelled by admin";

    const before = await donationRepository.findById(id);
    if (!before) {
      throw new AppError("NOT_FOUND", "Donation not found");
    }

    if (before.paymentStatus === "SUCCESS") {
      throw new AppError("CONFLICT", "Successful payments cannot be cancelled. Use refund instead.");
    }

    if (!cancellableStatuses.has(before.paymentStatus)) {
      throw new AppError("CONFLICT", "Donation cannot be cancelled in its current payment state");
    }

    await connectToDatabase();
    const updated = await Donation.findOneAndUpdate(
      {
        donationId: before.donationId,
        paymentStatus: { $in: Array.from(cancellableStatuses) },
      },
      {
        $set: {
          paymentStatus: "CANCELLED",
          bookingStatus: "CANCELLED",
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        $push: {
          paymentLogs: {
            status: "CANCELLED",
            timestamp: new Date(),
            rawResponse: { source: "admin", reason },
          },
        },
      },
      { new: true }
    ).lean() as any;

    if (!updated) {
      throw new AppError("CONFLICT", "Donation could not be cancelled");
    }

    const after = await donationRepository.findById(before.donationId);

    await auditLogRepository.create({
      adminId,
      action: "CANCEL_DONATION",
      collection: "Donation",
      recordId: before.donationId,
      oldValues: before,
      newValues: after,
    });

    return Response.json({ donation: after });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
