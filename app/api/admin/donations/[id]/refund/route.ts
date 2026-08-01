export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { Donation } from "@/lib/db/models/Donation";
import { connectToDatabase } from "@/lib/db/connect";
import { RazorpayService } from "@/lib/payment/RazorpayService";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId || session?.user?.role !== "ADMIN") {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const requestedAmount = body.amount === undefined || body.amount === null || body.amount === ""
      ? undefined
      : Number(body.amount);

    if (!reason) {
      throw new AppError("BAD_REQUEST", "Refund reason is required");
    }

    const before = await donationRepository.findById(id);
    if (!before) {
      throw new AppError("NOT_FOUND", "Donation not found");
    }

    if (before.paymentStatus !== "SUCCESS") {
      throw new AppError("CONFLICT", "Only successful payments can be refunded");
    }

    if (!before.razorpayPaymentId) {
      throw new AppError("BAD_REQUEST", "Razorpay payment ID is required before refunding");
    }

    const refundAmount = requestedAmount === undefined ? before.amount : requestedAmount;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > before.amount) {
      throw new AppError("BAD_REQUEST", "Refund amount must be greater than zero and not exceed the donation amount");
    }

    const refund = await RazorpayService.refundPayment(
      before.razorpayPaymentId,
      Math.round(refundAmount * 100),
      {
        reason,
        donationId: before.donationId,
      }
    ) as any;

    await connectToDatabase();
    await Donation.updateOne(
      { donationId: before.donationId, paymentStatus: "SUCCESS" },
      {
        $set: {
          paymentStatus: "REFUND_INITIATED",
          refundStatus: "INITIATED",
          refundId: refund.id,
          refundReason: reason,
        },
        $push: {
          refunds: {
            refundId: refund.id,
            paymentId: before.razorpayPaymentId,
            amount: refundAmount,
            reason,
            status: "INITIATED",
            rawResponse: { refundId: refund.id, amount: refundAmount },
          },
          paymentLogs: {
            status: "REFUND_INITIATED",
            timestamp: new Date(),
            rawResponse: { refundId: refund.id, amount: refundAmount, reason },
          },
        },
      }
    );

    const after = await donationRepository.findById(before.donationId);

    await auditLogRepository.create({
      adminId,
      action: "REFUND_DONATION",
      collection: "Donation",
      recordId: before.donationId,
      oldValues: before,
      newValues: after,
    });

    return Response.json({ donation: after, refundId: refund.id });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
