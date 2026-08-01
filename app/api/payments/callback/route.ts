export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/payment/RazorpayService";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { processRazorpaySuccess, refundPaymentStatus } from "@/lib/payment/paymentLifecycle";
import { Donation } from "@/lib/db/models/Donation";
import { WebhookEvent } from "@/lib/db/models/WebhookEvent";
import { connectToDatabase } from "@/lib/db/connect";
import { enforceRateLimit } from "@/lib/rateLimit";

/**
 * Razorpay Webhook Handler
 *
 * NOTE: Configure this in Razorpay Dashboard > Settings > Webhooks with URL:
 * https://yourdomain.com/api/payments/callback, then copy the generated secret
 * into RAZORPAY_WEBHOOK_SECRET. Do not reuse RAZORPAY_KEY_SECRET here.
 */
export async function POST(req: Request) {
  const rateLimitResponse = await enforceRateLimit(req, "payments:webhook");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const eventId = req.headers.get("x-razorpay-event-id");

    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    const isValid = RazorpayService.validateWebhook(rawBody, signature);
    if (!isValid) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Webhook signature validation failed");
      }
      return new NextResponse("Invalid Signature", { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (eventId) {
      await connectToDatabase();
      try {
        await WebhookEvent.create({
          eventId,
          eventType: event,
          status: "PROCESSED",
        });
      } catch (error: any) {
        // E11000 duplicate key error means we already processed this exact webhook event
        if (error.code === 11000) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Webhook event ${eventId} already processed, skipping.`);
          }
          return new NextResponse("OK", { status: 200 });
        }
        throw error;
      }
    }

    if (event === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      if (!payment) {
        return new NextResponse("Missing payment entity", { status: 400 });
      }

      if (payment.order_id && payment.id) {
        await connectToDatabase();
        const donation = await donationRepository.findByRazorpayOrderId(payment.order_id);
        
        if (donation) {
          const expectedAmount = Math.round((donation.totalPaid || donation.amount) * 100);
          
          if (payment.amount !== expectedAmount) {
            console.error(`Amount mismatch for order ${payment.order_id}: Expected ${expectedAmount}, got ${payment.amount}. Initiating refund.`);
            
            await donationRepository.updateRazorpayPaymentStatus(payment.order_id, {
              paymentStatus: "FAILED",
              paymentLog: { 
                status: "FAILED", 
                rawResponse: { 
                  source: "webhook_amount_mismatch",
                  orderId: payment.order_id, 
                  paymentId: payment.id,
                  expected: expectedAmount,
                  actual: payment.amount
                } 
              },
            });
            
            try {
              await RazorpayService.refundPayment(payment.id, payment.amount, {
                reason: "Amount mismatch detected by webhook",
                donationId: donation.donationId
              });
            } catch (refundError: any) {
              console.error("Auto-refund failed for amount mismatch:", refundError?.message);
            }
          } else {
            await processRazorpaySuccess({
              razorpayOrderId: payment.order_id,
              razorpayPaymentId: payment.id,
              signatureVerified: false,
              captured: payment.status === "captured",
              source: "webhook",
              rawResponse: { orderId: payment.order_id, paymentId: payment.id, status: payment.status },
            });
          }
        }
      }
    } else if (event === "payment.failed") {
      const payment = payload.payload?.payment?.entity;
      if (payment?.order_id) {
        const donation = await donationRepository.findByRazorpayOrderId(payment.order_id);
        if (donation && donation.paymentStatus !== "SUCCESS") {
          await donationRepository.updateRazorpayPaymentStatus(payment.order_id, {
            paymentStatus: "FAILED",
            paymentLog: { status: "FAILED", rawResponse: { orderId: payment.order_id, paymentId: payment.id } },
          });
        }
      }
    } else if (event === "refund.processed") {
      const refund = payload.payload?.refund?.entity;
      await handleRefundWebhook(refund, "processed");
    } else if (event === "refund.failed") {
      const refund = payload.payload?.refund?.entity;
      await handleRefundWebhook(refund, "failed");
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Webhook route error", { message: error?.message });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function handleRefundWebhook(refund: any, outcome: "processed" | "failed") {
  if (!refund?.id || !refund?.payment_id) {
    return;
  }

  await connectToDatabase();
  const donation = await Donation.findOne({ razorpayPaymentId: refund.payment_id }).lean() as any;
  if (!donation) {
    return;
  }

  const existingRefund = (donation.refunds || []).find((item: any) => item.refundId === refund.id);
  const previousAmount = existingRefund?.status === "PROCESSED" ? Number(existingRefund.amount || 0) : 0;
  const incomingAmount = Number(refund.amount || 0) / 100;
  const nextRefundedAmount = outcome === "processed"
    ? Math.max(0, Number(donation.refundedAmount || 0) - previousAmount + incomingAmount)
    : Number(donation.refundedAmount || 0);

  const nextPaymentStatus = outcome === "processed"
    ? refundPaymentStatus(Number(donation.amount || 0), nextRefundedAmount)
    : "REFUND_FAILED";

  const nextRefundStatus = outcome === "processed"
    ? (nextPaymentStatus === "REFUNDED" ? "PROCESSED" : "PARTIAL")
    : "FAILED";

  await Donation.updateOne(
    { donationId: donation.donationId },
    {
      $set: {
        paymentStatus: nextPaymentStatus,
        refundStatus: nextRefundStatus,
        refundedAmount: nextRefundedAmount,
        refundId: refund.id,
        ...(outcome === "processed" ? { bookingStatus: "CANCELLED" } : {}),
      },
      $pull: { refunds: { refundId: refund.id } },
      $push: {
        paymentLogs: {
          status: outcome === "processed" ? "REFUND_PROCESSED" : "REFUND_FAILED",
          timestamp: new Date(),
          rawResponse: { refundId: refund.id, paymentId: refund.payment_id, amount: incomingAmount },
        },
      },
    }
  );

  await Donation.updateOne(
    { donationId: donation.donationId },
    {
      $push: {
        refunds: {
          refundId: refund.id,
          paymentId: refund.payment_id,
          amount: incomingAmount,
          reason: existingRefund?.reason || refund.notes?.reason || "Razorpay refund webhook",
          status: outcome === "processed" ? "PROCESSED" : "FAILED",
          processedAt: new Date(),
          rawResponse: { refundId: refund.id, paymentId: refund.payment_id, amount: incomingAmount },
        },
      },
    }
  );
}
