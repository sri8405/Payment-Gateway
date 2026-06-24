import { DonationsTable } from "@/components/admin/DonationsTable";
import { AdminShell } from "@/components/layout/AdminShell";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";

export const dynamic = "force-dynamic";

export default async function AdminDonationsPage() {
  const [donations, sevas] = await Promise.all([
    donationRepository.findAll({ page: 1, limit: 20 }),
    sevaRepository.findAll()
  ]);

  return (
    <AdminShell>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seva Bookings</h1>
        <p className="text-sm text-muted-foreground">Search, verify, export, and review seva booking records</p>
      </div>
      <DonationsTable initialRows={donations.rows} initialTotal={donations.total} sevas={sevas} />
    </div>
    </AdminShell>
  );
}
