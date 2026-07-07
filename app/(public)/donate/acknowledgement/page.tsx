import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ReceiptDownload } from "@/components/donation/ReceiptDownload";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AcknowledgementPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id) notFound();
  
  const settings = await templeSettingsRepository.getCurrentOrDefault();
  const donation = await donationRepository.findById(id);

  if (!donation) notFound();

  // Status visual mapping
  const isSuccess = donation.paymentStatus === "SUCCESS";
  const isPending = donation.paymentStatus === "PENDING" || donation.paymentStatus === "INITIATED";
  const isFailed = donation.paymentStatus === "FAILED";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 animate-fade-in-up">
      <div className="text-center mb-10">
        {isSuccess && <CheckCircle2 className="w-20 h-20 text-success mx-auto mb-6" />}
        {isPending && <Clock className="w-20 h-20 text-saffron mx-auto mb-6" />}
        {isFailed && <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />}
        
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          {isSuccess ? "Seva Booking Confirmed" : 
           isPending ? "Payment Pending" : 
           "Payment Failed"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isSuccess ? "Your seva offering has been successfully received." : 
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
            <Info label="Amount" value={`₹${donation.amount}`} />
            
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
                      isSuccess ? 'bg-success hover:bg-success/90 text-white' :
                      isPending ? 'bg-saffron hover:bg-saffron/90 text-white' :
                      'bg-destructive hover:bg-destructive/90 text-white'
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
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex flex-col gap-4 p-6">
          {isSuccess ? (
            <>
              <ReceiptDownload donation={donation} settings={settings} />
              <p className="text-xs text-center text-muted-foreground mt-2">
                An SMS and Email with the receipt have been sent to your registered contact details.
              </p>
            </>
          ) : isPending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-saffron">
              <AlertCircle size={16} />
              <span>Please check this page again in a few minutes.</span>
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
