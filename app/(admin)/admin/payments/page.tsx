import { AdminShell } from "@/components/layout/AdminShell";
import { DonationsTable } from "@/components/admin/DonationsTable";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [donationsData, sevas, settings] = await Promise.all([
    donationRepository.findAll({ limit: 20 }),
    sevaRepository.findAll(),
    templeSettingsRepository.getCurrentOrDefault(),
  ]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-temple-maroon">Payment History</h1>
          <p className="text-sm text-muted-foreground">View all seva booking payments</p>
        </div>
        <DonationsTable initialRows={donationsData.rows} initialTotal={donationsData.total} sevas={sevas} settings={settings} />
      </div>
    </AdminShell>
  );
}
