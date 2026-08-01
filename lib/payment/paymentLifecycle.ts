import { Donation } from "@/lib/db/models/Donation";
import { connectToDatabase } from "@/lib/db/connect";
import { generateReceiptNumber } from "@/lib/utils/receiptNumber";
import { canGenerateReceipt } from "@/lib/utils/receiptSafety";
import { sendDonationReceipt } from "@/lib/sendDonationReceipt";


export async function ensureReceiptIfAllowed(razorpayOrderId: string) {
  await connectToDatabase();

  const donation = await Donation.findOne({ razorpayOrderId }).lean() as any;
  if (!donation) {
    return null;
  }

  if (donation.receiptNumber) {
    if (donation.status !== "VERIFIED") {
      await Donation.updateOne({ donationId: donation.donationId }, { $set: { status: "VERIFIED" } });
    }
    return donation.donationId as string;
  }

  if (!canGenerateReceipt(donation)) {
    return donation.donationId as string;
  }

  const receiptNumber = await generateReceiptNumber();
  const updated = await Donation.findOneAndUpdate(
    {
      razorpayOrderId,
      paymentStatus: "SUCCESS",
      razorpayCaptured: true,
      signatureVerified: true,
      $or: [{ receiptNumber: { $exists: false } }, { receiptNumber: null }, { receiptNumber: "" }],
    },
    {
      $set: {
        status: "VERIFIED",
        receiptNumber,
      },
    },
    { new: true }
  ).lean() as any;

  if (updated) {
    if (updated.email) {
      sendDonationReceipt({
        name: updated.name,
        email: updated.email,
        phone: updated.mobile,
        gothra: updated.gothra,
        seva: updated.sevaName,
        amount: updated.amount,
        processingCharge: updated.processingCharge || 0,
        totalPaid: updated.totalPaid || updated.amount,
        receiptNumber: updated.receiptNumber,
        paymentId: updated.razorpayPaymentId || "N/A",
        transactionId: updated.donationId,
        donationDate: new Date(updated.createdAt || Date.now()).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        }),
      }).catch((emailError) => {
        console.error("❌ Email Sending Failed");
        console.error(`Error Message: ${emailError?.message || "Unknown error"}`);
        console.error(`Stack Trace: ${emailError?.stack || JSON.stringify(emailError)}`);
      });
    }
    return updated.donationId as string;
  }

  const refreshed = await Donation.findOne({ razorpayOrderId }).lean() as any;
  if (refreshed?.receiptNumber && refreshed.status !== "VERIFIED") {
    await Donation.updateOne({ donationId: refreshed.donationId }, { $set: { status: "VERIFIED" } });
  }

  return (refreshed?.donationId || donation.donationId) as string;
}

type SuccessInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  signatureVerified: boolean;
  captured: boolean;
  source: "verify" | "webhook" | "reconcile";
  rawResponse?: unknown;
};

export async function processRazorpaySuccess(input: SuccessInput) {
  await connectToDatabase();

  const update: Record<string, unknown> = {
    paymentStatus: "SUCCESS",
    razorpayPaymentId: input.razorpayPaymentId,
    razorpayCaptured: input.captured,
    paymentGateway: "Razorpay",
    transactionTime: new Date(),
  };

  if (input.razorpaySignature) {
    update.razorpaySignature = input.razorpaySignature;
  }
  if (input.signatureVerified) {
    update.signatureVerified = true;
  }

  const updated = await Donation.findOneAndUpdate(
    {
      razorpayOrderId: input.razorpayOrderId,
      paymentStatus: { $nin: ["REFUNDED", "PARTIALLY_REFUNDED"] },
    },
    {
      $set: update,
      $push: {
        paymentLogs: {
          status: "SUCCESS",
          timestamp: new Date(),
          rawResponse: {
            source: input.source,
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            captured: input.captured,
            signatureVerified: input.signatureVerified,
            rawResponse: input.rawResponse,
          },
        },
      },
    },
    { new: true }
  ).lean() as any;

  if (!updated) {
    return null;
  }

  const donationId = await ensureReceiptIfAllowed(input.razorpayOrderId);
  return { ...updated, donationId: donationId || updated.donationId };
}

export function refundPaymentStatus(amount: number, refundedAmount: number) {
  return refundedAmount >= amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
}

