import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DonationDetailPage({ params }: Props) {
  const { id } = await params;
  const donation = await donationRepository.findById(id);
  if (!donation) notFound();

  const fields = [
    ["Donation ID", donation.donationId],
    ["Date", new Date(donation.createdAt).toLocaleString()],
    ["Name", donation.name],
    ["Gothra", donation.gothra],
    ["Mobile", donation.mobile || "-"],
    ["Email", donation.email || "-"],
    ["Seva", donation.sevaName],
    ["Amount", `Rs ${donation.amount}`]
  ];

  return (
    <AdminShell>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Donation Details</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            {donation.donationId}
            <Badge variant={donation.status === "VERIFIED" ? "default" : "secondary"}>{donation.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
    </AdminShell>
  );
}
