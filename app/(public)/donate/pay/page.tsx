import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { paymentService } from "@/lib/payment/UPIPaymentService";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { PaymentSection } from "@/components/donation/PaymentSection";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function PayPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id) notFound();
  const userAgent = (await headers()).get("user-agent") || "";
  const initialDeviceType = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    ? "mobile"
    : "desktop";
  const settings = await templeSettingsRepository.getCurrentOrDefault();
  let donation: Awaited<ReturnType<typeof donationRepository.findById>> = null;
  donation = await donationRepository.findById(id);

  if (!donation) notFound();
  const paymentUpiId = settings.upiId || "9880742348@ybl";
  const paymentUpiName = settings.upiDisplayName || settings.templeName;
  const payment = await paymentService.initiatePayment({
    donationId: donation.donationId,
    amount: donation.amount,
    name: donation.name,
    sevaName: donation.sevaName,
    upiId: paymentUpiId,
    upiDisplayName: paymentUpiName
  });

  return (
    <main>
      <PublicHeader settings={settings} />
      <section className="mx-auto max-w-xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>UPI Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Donation ID</dt>
              <dd className="font-medium">{donation.donationId}</dd>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{donation.name}</dd>
              <dt className="text-muted-foreground">Seva</dt>
              <dd className="font-medium">{donation.sevaName}</dd>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">Rs {donation.amount}</dd>
            </dl>
            <PaymentSection
              paymentUrl={payment.paymentUrl}
              upiId={paymentUpiId}
              amount={donation.amount}
              donationId={donation.donationId}
              initialDeviceType={initialDeviceType}
            />
            <Button asChild variant="outline" className="w-full">
              <Link href={`/donate/acknowledgement?id=${encodeURIComponent(donation.donationId)}`}>Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
