import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptDownload } from "@/components/donation/ReceiptDownload";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AcknowledgementPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id) notFound();
  const settings = await templeSettingsRepository.getCurrentOrDefault();
  let donation: Awaited<ReturnType<typeof donationRepository.findById>> = null;
  donation = await donationRepository.findById(id);

  if (!donation) notFound();

  return (
    <main>
      <PublicHeader settings={settings} />
      <section className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Seva Booking Acknowledgement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Seva Booking ID" value={donation.donationId} />
              <Info label="Date" value={new Date(donation.createdAt).toLocaleString()} />
              <Info label="Name" value={donation.name} />
              <Info label="Gothra" value={donation.gothra} />
              <Info label="Seva" value={donation.sevaName} />
              <Info label="Amount" value={`Rs ${donation.amount}`} />
              <div>
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="mt-1"><Badge variant={donation.status === "VERIFIED" ? "default" : "secondary"}>{donation.status}</Badge></dd>
              </div>
            </dl>
            <ReceiptDownload donation={donation} settings={settings} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
