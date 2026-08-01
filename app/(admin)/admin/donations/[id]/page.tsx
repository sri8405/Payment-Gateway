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
    ["Seva Booking ID", donation.donationId],
    ["Date", new Date(donation.createdAt).toLocaleString()],
    ["Name", donation.name],
    ["Gothra", donation.gothra],
    ["Mobile", donation.mobile || "-"],
    ["Email", donation.email || "-"],
    ["Seva", donation.sevaName],
    ["Seva Amount", `₹${donation.amount}`],
    ["Processing Charges (incl. GST)", `₹${(donation.processingCharge || 0).toFixed(2)}`],
    ["Total Paid by Devotee", `₹${(donation.totalPaid || donation.amount).toFixed(2)}`],
    ["Net Temple Amount", `₹${donation.amount}`],
    ["Payment Status", donation.paymentStatus],
    ["Refund Status", donation.refundStatus || "NONE"],
    ["Refunded Amount", `Rs ${donation.refundedAmount || 0}`],
    ["Last Reconciled", donation.lastReconciledAt ? new Date(donation.lastReconciledAt).toLocaleString() : "-"],
    ["Reconciliation Status", donation.reconciliationStatus || "-"],
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Seva Booking Details</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              {donation.donationId}
              <div className="flex gap-2">
                <Badge variant={donation.status === "VERIFIED" ? "default" : "secondary"}>{donation.status}</Badge>
                <Badge variant={donation.paymentStatus === "SUCCESS" ? "default" : "outline"}>{donation.paymentStatus}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h2 className="mb-2 font-semibold">Reconciliation History</h2>
              <div className="space-y-2 text-sm">
                {(donation.reconciliationLogs || []).length === 0 ? (
                  <p className="text-muted-foreground">No reconciliation actions recorded.</p>
                ) : (
                  (donation.reconciliationLogs || []).map((log: any, index: number) => (
                    <div key={`${log.action}-${index}`} className="rounded-md border p-3">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-muted-foreground">{log.note || "-"}</div>
                      <div className="text-xs text-muted-foreground">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
