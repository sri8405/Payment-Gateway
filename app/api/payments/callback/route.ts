import { NextResponse } from "next/server";
import { PhonePeService } from "@/lib/payment/PhonePeService";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { generateReceiptNumber } from "@/lib/utils/receiptNumber";


export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const xVerify = req.headers.get("x-verify") || "";
    
    // The webhook payload is wrapped in a request object and base64 encoded
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    const base64Response = parsedBody.response;
    if (!base64Response) {
      return new NextResponse("Missing response payload", { status: 400 });
    }

    const isValid = await PhonePeService.validateCallback(base64Response, xVerify);
    if (!isValid) {
      return new NextResponse("Invalid Signature", { status: 400 });
    }

    const decodedString = Buffer.from(base64Response, "base64").toString("utf8");
    const responsePayload = JSON.parse(decodedString);

    const merchantTransactionId = responsePayload.data?.merchantTransactionId;
    const phonePeTransactionId = responsePayload.data?.transactionId;
    const paymentStatus = responsePayload.code === "PAYMENT_SUCCESS" ? "SUCCESS" : "FAILED";

    if (merchantTransactionId) {
      const updated = await donationRepository.updatePaymentStatus(merchantTransactionId, {
        paymentStatus,
        phonePeTransactionId,
        paymentLog: { status: paymentStatus, rawResponse: responsePayload }
      });

      if (paymentStatus === "SUCCESS" && !updated.receiptNumber) {
         const receiptNumber = await generateReceiptNumber();
         await donationRepository.updateById(updated.donationId, {
           status: "VERIFIED",
           receiptNumber
         });
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("Callback Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
