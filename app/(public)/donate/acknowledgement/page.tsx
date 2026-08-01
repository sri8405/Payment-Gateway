import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ReceiptDownload } from "@/components/donation/ReceiptDownload";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { verifySecureToken } from "@/lib/utils/secureToken";
import { CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcknowledgementPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) notFound();

  const donationId = verifySecureToken(token);
  if (!donationId) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center animate-fade-in-up">
        <AlertCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Link Expired or Invalid</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          For security and privacy reasons, receipt links expire after 15 minutes. 
          If you need a copy of your receipt, please check your registered email or contact the temple office.
        </p>
        <a href="/donate">
          <div className="inline-block px-8 py-3 rounded-full bg-saffron text-white font-medium hover:bg-saffron/90 transition-colors">
            Return to Donations
          </div>
        </a>
      </div>
    );
  }

  const settings = await templeSettingsRepository.getCurrentOrDefault();
  const donation = await donationRepository.findById(donationId);

  if (!donation) notFound();

  // Create a sanitized subset of the donation to pass to Client Components
  // to prevent leaking sensitive API/payment details in the React payload.
  const safeDonation = {
    donationId: donation.donationId,
    createdAt: donation.createdAt,
    name: donation.name,
    gothra: donation.gothra,
    nakshatra: donation.nakshatra,
    mobile: donation.mobile,
    email: donation.email,
    sevaName: donation.sevaName,
    amount: donation.amount,
    paymentMethod: donation.paymentMethod,
    paymentSource: donation.paymentSource,
    status: donation.status,
    receiptNumber: donation.receiptNumber,
    processingCharge: donation.processingCharge || 0,
    totalPaid: donation.totalPaid || donation.amount,
  };

  const isRefunded = donation.paymentStatus === "REFUNDED" || donation.paymentStatus === "PARTIALLY_REFUNDED";
  const isSuccess = donation.paymentStatus === "SUCCESS";
  const isPending = donation.paymentStatus === "PENDING" || donation.paymentStatus === "INITIATED" || donation.paymentStatus === "REFUND_INITIATED";
  const isFailed = donation.paymentStatus === "FAILED" || donation.paymentStatus === "CANCELLED" || donation.paymentStatus === "REFUND_FAILED";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 animate-fade-in-up">
      {isRefunded && (
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900">
          <div className="flex items-center gap-3 font-semibold">
            <RotateCcw className="h-5 w-5" />
            REFUNDED
          </div>
          <p className="mt-2 text-sm">
            This payment has been {donation.paymentStatus === "PARTIALLY_REFUNDED" ? "partially refunded" : "fully refunded"}.
            Refunded amount: Rs {donation.refundedAmount || 0}.
          </p>
        </div>
      )}

      <div className="text-center mb-10">
        {isSuccess && <CheckCircle2 className="w-20 h-20 text-success mx-auto mb-6" />}
        {isRefunded && <RotateCcw className="w-20 h-20 text-blue-600 mx-auto mb-6" />}
        {isPending && <Clock className="w-20 h-20 text-saffron mx-auto mb-6" />}
        {isFailed && <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />}

        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          {isRefunded ? "Payment Refunded" :
           isSuccess ? "Seva Booking Confirmed" :
           isPending ? "Payment Pending" :
           "Payment Failed"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isRefunded ? "Your payment refund has been processed by the payment gateway." :
           isSuccess ? "Your seva offering has been successfully received." :
           isPending ? "We are waiting for confirmation from the payment gateway." :
           "There was an issue processing your payment. Please try again."}
        </p>
      </div>

      <Card className="border-saffron/20 shadow-xl overflow-hidden rounded-2xl bg-white/95 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-gold/10 border-b border-saffron/20 pb-6 text-center">
          <CardTitle className="text-xl font-serif text-copper">Seva Sankalpa Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Info label="Booking ID" value={donation.donationId} />
            <Info label="Date" value={new Date(donation.createdAt).toLocaleString()} />
            <Info label="Devotee Name" value={donation.name} />
            <Info label="Gothra" value={donation.gothra || "-"} />
            {donation.nakshatra && <Info label="Nakshatra" value={donation.nakshatra} />}
            <Info label="Seva Offering" value={donation.sevaName} />
            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border/50 mt-2">
              <div className="bg-muted/20 p-4 rounded-lg border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Seva Amount</span>
                  <span className="font-medium">₹{donation.amount.toFixed(2)}</span>
                </div>
                {(donation.processingCharge || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payment Processing Charges (incl. GST)</span>
                    <span className="font-medium">₹{(donation.processingCharge || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="font-semibold text-foreground">Total Paid</span>
                  <span className="font-bold text-lg text-copper">₹{(donation.totalPaid || donation.amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
            {isRefunded && <Info label="Refunded Amount" value={`Rs ${donation.refundedAmount || 0}`} />}

            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Payment Method</dt>
                  <dd className="font-medium">{donation.paymentMethod || "Online / UPI"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Payment Source</dt>
                  <dd className="font-medium">{donation.paymentSource || "Online"}</dd>
                </div>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border mt-2">
              <div className="flex justify-between items-center">
                <dt className="text-sm font-medium text-muted-foreground">Payment Status</dt>
                <dd>
                  <Badge
                    className={`text-sm px-3 py-1 ${
                      isSuccess ? "bg-success hover:bg-success/90 text-white" :
                      isRefunded ? "bg-blue-600 hover:bg-blue-700 text-white" :
                      isPending ? "bg-saffron hover:bg-saffron/90 text-white" :
                      "bg-destructive hover:bg-destructive/90 text-white"
                    }`}
                  >
                    {donation.paymentStatus}
                  </Badge>
                </dd>
              </div>
            </div>

            {donation.receiptNumber && (
              <div className="col-span-1 sm:col-span-2">
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-muted-foreground">Receipt Number</dt>
                  <dd className="font-mono text-sm">{donation.receiptNumber}</dd>
                </div>
              </div>
            )}

            {(donation.processingCharge || 0) > 0 && (
              <div className="col-span-1 sm:col-span-2 mt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Payment Processing Charges (incl. GST) represent the payment gateway processing fee charged by Razorpay together with the applicable GST on that fee. These charges are paid by the devotee so that the temple receives the complete Seva amount without any deduction.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex flex-col gap-4 p-6">
          {isSuccess ? (
            <>
              <ReceiptDownload donation={safeDonation} settings={settings} />
              <p className="text-xs text-center text-muted-foreground mt-2">
                An SMS and Email with the receipt have been sent to your registered contact details.
              </p>
            </>
          ) : isPending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-saffron">
              <AlertCircle size={16} />
              <span>Please check this page again in a few minutes.</span>
            </div>
          ) : isRefunded ? (
            <div className="text-sm text-center text-blue-700">
              Refund details are shown above. Please contact the temple office for any questions.
            </div>
          ) : (
            <a href="/donate" className="w-full">
              <div className="w-full text-center px-4 py-3 rounded-full bg-saffron text-white font-medium hover:bg-saffron/90 transition-colors">
                Try Booking Again
              </div>
            </a>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/20 p-4 rounded-lg border border-border/50">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</dt>
      <dd className="font-medium text-foreground text-lg">{value}</dd>
    </div>
  );
}
