import { NextRequest, NextResponse } from "next/server";
import { Donation } from "@/lib/db/models/Donation";
import { connectToDatabase } from "@/lib/db/connect";
import { RazorpayService } from "@/lib/payment/RazorpayService";
import { processRazorpaySuccess } from "@/lib/payment/paymentLifecycle";

function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();
  const staleCancelBefore = new Date(now.getTime() - 15 * 60 * 1000);
  const reconcileBefore = new Date(now.getTime() - 30 * 60 * 1000);

  const cancelled = await Donation.updateMany(
    {
      paymentStatus: { $in: ["PENDING", "INITIATED"] },
      createdAt: { $lte: staleCancelBefore },
      $or: [{ razorpayOrderId: { $exists: false } }, { razorpayOrderId: null }, { razorpayOrderId: "" }],
    },
    {
      $set: {
        paymentStatus: "CANCELLED",
        bookingStatus: "CANCELLED",
        cancellationReason: "Payment was not completed within the allowed window",
        cancelledAt: now,
      },
      $push: {
        reconciliationLogs: {
          action: "AUTO_CANCEL_STALE_NO_ORDER",
          note: "No Razorpay order after approximately 15 minutes",
          timestamp: now,
        },
        paymentLogs: {
          status: "CANCELLED",
          timestamp: now,
          rawResponse: { source: "cron", reason: "stale_no_order" },
        },
      },
    }
  );

  const donations = await Donation.find({
    paymentStatus: { $in: ["PENDING", "INITIATED"] },
    razorpayOrderId: { $exists: true, $nin: [null, ""] },
    createdAt: { $lte: reconcileBefore },
  }).limit(50).lean() as any[];

  const actions: Array<{ donationId: string; action: string; note?: string }> = [];

  for (const donation of donations) {
    try {
      const [order, paymentsResult] = await Promise.all([
        RazorpayService.fetchOrder(donation.razorpayOrderId),
        RazorpayService.fetchOrderPayments(donation.razorpayOrderId),
      ]) as any[];

      const payments = paymentsResult?.items || [];
      const captured = payments.find((payment: any) => payment.status === "captured");
      const authorized = payments.find((payment: any) => payment.status === "authorized");

      if (captured) {
        const expectedAmount = Math.round((donation.totalPaid || donation.amount) * 100);
        
        if (captured.amount !== expectedAmount) {
          await Donation.updateOne(
            { donationId: donation.donationId },
            {
              $set: {
                paymentStatus: "FAILED",
                lastReconciledAt: now,
                reconciliationStatus: "FAILED_AMOUNT_MISMATCH",
              },
              $push: {
                reconciliationLogs: {
                  action: "FAILED_AMOUNT_MISMATCH",
                  note: `Amount mismatch for order ${donation.razorpayOrderId}: Expected ${expectedAmount}, got ${captured.amount}. Auto-refund triggered.`,
                  timestamp: now,
                  rawResponse: { expected: expectedAmount, actual: captured.amount },
                },
                paymentLogs: {
                  status: "FAILED",
                  timestamp: now,
                  rawResponse: { source: "reconcile", reason: "amount_mismatch", expected: expectedAmount, actual: captured.amount },
                },
              },
            }
          );
          
          try {
            await RazorpayService.refundPayment(captured.id, captured.amount, {
              reason: "Amount mismatch detected by reconciliation",
              donationId: donation.donationId
            });
          } catch (refundError: any) {
            console.error("Auto-refund failed for amount mismatch in cron:", refundError?.message);
          }
          
          actions.push({ donationId: donation.donationId, action: "FAILED_AMOUNT_MISMATCH" });
        } else {
          await processRazorpaySuccess({
            razorpayOrderId: donation.razorpayOrderId,
            razorpayPaymentId: captured.id,
            signatureVerified: false,
            captured: true,
            source: "reconcile",
            rawResponse: { orderId: donation.razorpayOrderId, paymentId: captured.id },
          });
          await Donation.updateOne(
            { donationId: donation.donationId },
            {
              $set: {
                lastReconciledAt: now,
                reconciliationStatus: "SUCCESS_CONFIRMED",
              },
              $push: {
                reconciliationLogs: {
                  action: "SUCCESS_CONFIRMED",
                  note: "Captured Razorpay payment found during reconciliation",
                  timestamp: now,
                  rawResponse: { orderStatus: order?.status, paymentId: captured.id },
                },
              },
            }
          );
          actions.push({ donationId: donation.donationId, action: "SUCCESS_CONFIRMED" });
        }
      } else if (authorized) {
        await Donation.updateOne(
          { donationId: donation.donationId },
          {
            $set: {
              lastReconciledAt: now,
              reconciliationStatus: "ADMIN_REVIEW_AUTHORIZED_NOT_CAPTURED",
            },
            $push: {
              reconciliationLogs: {
                action: "ADMIN_REVIEW_AUTHORIZED_NOT_CAPTURED",
                note: "Authorized payment found but not captured",
                timestamp: now,
                rawResponse: { orderStatus: order?.status, paymentId: authorized.id },
              },
            },
          }
        );
        actions.push({ donationId: donation.donationId, action: "ADMIN_REVIEW_AUTHORIZED_NOT_CAPTURED" });
      } else {
        await Donation.updateOne(
          { donationId: donation.donationId, paymentStatus: { $in: ["PENDING", "INITIATED"] } },
          {
            $set: {
              paymentStatus: "FAILED",
              lastReconciledAt: now,
              reconciliationStatus: "FAILED_NO_PAYMENT",
            },
            $push: {
              reconciliationLogs: {
                action: "FAILED_NO_PAYMENT",
                note: "No captured or authorized payment found for stale order",
                timestamp: now,
                rawResponse: { orderStatus: order?.status },
              },
              paymentLogs: {
                status: "FAILED",
                timestamp: now,
                rawResponse: { source: "cron", reason: "no_payment_found" },
              },
            },
          }
        );
        actions.push({ donationId: donation.donationId, action: "FAILED_NO_PAYMENT" });
      }
    } catch (error: any) {
      await Donation.updateOne(
        { donationId: donation.donationId },
        {
          $set: {
            lastReconciledAt: now,
            reconciliationStatus: "RECONCILE_ERROR",
          },
          $push: {
            reconciliationLogs: {
              action: "RECONCILE_ERROR",
              note: error?.message || "Razorpay reconciliation failed",
              timestamp: now,
            },
          },
        }
      );
      actions.push({ donationId: donation.donationId, action: "RECONCILE_ERROR", note: error?.message });
    }
  }

  return NextResponse.json({
    success: true,
    cancelledWithoutOrder: cancelled.modifiedCount || 0,
    reconciled: actions,
    notification: "Future enhancement: notify donors when reconciliation later confirms SUCCESS.",
  });
}
