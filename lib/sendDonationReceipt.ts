import { resend } from "@/lib/resend";

export interface SendDonationReceiptInput {
  name: string;
  email: string;
  phone?: string;
  gothra?: string;
  seva: string;
  amount: number;
  receiptNumber: string;
  paymentId: string;
  transactionId: string;
  donationDate: string;
  processingCharge?: number;
  totalPaid?: number;
}

export async function sendDonationReceipt(data: SendDonationReceiptInput): Promise<boolean> {
  if (!data.email) {
    console.warn("⚠️ [Email System] Skipping email send: Recipient email address is missing.");
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("❌ [Email System] Cannot send email: RESEND_API_KEY environment variable is missing.");
    return false;
  }

  const fromEmail = process.env.EMAIL_FROM || "GuruSeva <onboarding@resend.dev>";

  try {
    const htmlContent = `
      <div style="font-family: sans-serif; background-color: #f9fafb; padding: 24px; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f3f4f6;">
          <div style="background: linear-gradient(135deg, #c65910 0%, #d97706 100%); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px;">GuruSeva</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; text-transform: uppercase;">Donation Receipt</p>
          </div>
          <div style="padding: 24px;">
            <h2>Namaste, ${data.name}</h2>
            <p>Thank you for your sacred seva offering. Here is your official donation receipt.</p>
            <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
              <p><strong>Booking ID:</strong> ${data.transactionId}</p>
              <p><strong>Razorpay Payment ID:</strong> ${data.paymentId}</p>
              <p><strong>Date & Time:</strong> ${data.donationDate}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Devotee:</strong></td><td style="text-align: right;">${data.name}</td></tr>
              ${data.gothra ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Gothra:</strong></td><td style="text-align: right;">${data.gothra}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Seva Offering:</strong></td><td style="text-align: right;">${data.seva}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Seva Amount:</strong></td><td style="text-align: right;">₹${data.amount.toFixed(2)}</td></tr>
              ${(data.processingCharge && data.processingCharge > 0) ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Processing Charges (incl. GST):</strong></td><td style="text-align: right;">₹${data.processingCharge.toFixed(2)}</td></tr>` : ""}
              <tr><td style="padding: 12px 0;"><strong>Total Paid:</strong></td><td style="text-align: right; font-size: 18px; font-weight: bold; color: #c65910;">₹${(data.totalPaid || data.amount).toFixed(2)}</td></tr>
            </table>
            ${(data.processingCharge && data.processingCharge > 0) ? `<p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">Payment Processing Charges (incl. GST) are charged by Razorpay. The temple receives the complete Seva amount without any deduction.</p>` : ""}
          </div>
        </div>
      </div>
    `;

    const { data: responseData, error } = await resend.emails.send({
      from: fromEmail,
      to: [data.email],
      subject: "Your Donation Receipt | GuruSeva",
      html: htmlContent,
    });

    if (error) {
      console.error("❌ Email Sending Failed");
      console.error(`Error Message: ${error.message}`);
      console.error(`Stack Trace: ${JSON.stringify(error)}`);
      return false;
    }

    console.log("✅ Email Sent Successfully");
    console.log(`Receipt Number: ${data.receiptNumber}`);
    console.log(`Recipient Email: ${data.email}`);
    console.log(`Resend ID: ${responseData?.id}`);
    return true;
  } catch (error: any) {
    console.error("❌ Email Sending Failed");
    console.error(`Error Message: ${error?.message || "Unknown error"}`);
    console.error(`Stack Trace: ${error?.stack || JSON.stringify(error)}`);
    return false;
  }
}
